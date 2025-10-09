"use client";
import React, { useState, useCallback } from "react";
import Link from "next/link";

type SidebarProps = {
    // No children needed for this sidebar
};

const navItems = [
    { label: "Home", key: "dashboard" },
    { label: "Workouts", key: "dashboard/workouts" },
    { label: "Nutrition", key: "dashboard/nutrition" },
];

const bottomItems = [
    { label: "Settings", key: "dashboard/settings" },
    { label: "Account", key: "dashboard/account" },
];

const Sidebar: React.FC<SidebarProps> = React.memo(() => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpanded = useCallback(() => {
        setExpanded(prev => !prev);
    }, []);

    return (
        <aside
            className={`flex flex-col justify-between h-full bg-gray-800 text-white transition-all duration-300 ${
                expanded ? "w-64" : "w-16"
            }`}
        >
            <div>
                <div className="flex items-center justify-between p-4">
                    <span className="font-bold text-lg">
                        {expanded ? "Dashboard" : "DB"}
                    </span>
                    <button
                        onClick={toggleExpanded}
                        className="focus:outline-none"
                        aria-label="Toggle sidebar"
                    >
                        {expanded ? "◀" : "▶"}
                    </button>
                </div>
                <nav className="mt-4 flex flex-col gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.key}
                            href={`/${item.key}`}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-700 rounded transition-colors"
                        >
                            <span className="text-xl">●</span>
                            {expanded && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="flex flex-col gap-2 mb-4">
                {bottomItems.map((item) => (
                    <Link
                        key={item.key}
                        href={`/${item.key}`}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-700 rounded transition-colors"
                    >
                        <span className="text-xl">●</span>
                        {expanded && <span>{item.label}</span>}
                    </Link>
                ))}
            </div>
        </aside>
    );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;