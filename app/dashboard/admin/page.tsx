"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl } from '@/app/lib/apiClient';


interface User {
    id: string;
    email: string;
    role: 'admin' | 'staff' | 'user';
    createdAt: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
        checkAccess();
    }, []);

    const checkAccess = async () => {
        try {
            const response = await fetch(`${getApiUrl()}/api/me`, {
                credentials: 'include',
            });
            const data = await response.json();

            const role = data.role || data.user_metadata?.role;
            if (!data.id || !['admin', 'staff'].includes(role)) {
                router.push('/');
            }
        } catch {
            router.push('/');
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users', { credentials: 'include' });
            const data = await response.json();
            setUsers(data.users || []);
        } catch {
            setError('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (id: string) => {
        if (!confirm('Are you sure?')) return;

        try {
            await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            setUsers(users.filter(u => u.id !== id));
        } catch {
            setError('Failed to delete user');
        }
    };

    if (loading) return <div className="p-8 text-gray-900">Loading...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto text-gray-900">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <Link href="/dashboard/admin/email" className="bg-blue-600 text-white px-4 py-2 rounded">
                    Send Email
                </Link>
            </div>

            {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-gray-900">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border p-3 text-left text-gray-900">Email</th>
                            <th className="border p-3 text-left text-gray-900">Role</th>
                            <th className="border p-3 text-left text-gray-900">Created</th>
                            <th className="border p-3 text-left text-gray-900">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="border p-3 text-gray-900">{user.email}</td>
                                <td className="border p-3">
                                    <span className={`px-3 py-1 rounded text-sm ${
                                        user.role === 'admin' ? 'bg-red-100' : 'bg-blue-100'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="border p-3 text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td className="border p-3">
                                    <button
                                        onClick={() => deleteUser(user.id)}
                                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}