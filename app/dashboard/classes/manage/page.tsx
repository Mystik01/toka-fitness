'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit2, Loader2 } from 'lucide-react';
import { useUserRole } from '@/app/hooks/useUserRole';
import { getApiUrl } from '@/app/lib/apiClient';

interface DatabaseClass {
  id?: number;
  class_name: string;
  class_type: string;
  instructor: string;
  start: string;
  end: string;
  location: string;
  max_participants: number;
  participants?: string[];
  description?: string;
  created_at?: string;
}

const classTypes = [
  'yoga', 'hiit', 'spin', 'pilates', 'boxing', 'strength', 'dance', 'swimming'
];

export default function ManageClassesPage() {
  const router = useRouter();
  const { role, loading: roleLoading } = useUserRole();
  const [classes, setClasses] = useState<DatabaseClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [staffUsers, setStaffUsers] = useState<Array<{ id: string; email: string; name: string; role: string }>>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name?: string } | null>(null);

  const [formData, setFormData] = useState<DatabaseClass>({
    class_name: '',
    class_type: '',
    instructor: '',
    start: '',
    end: '',
    location: '',
    max_participants: 20,
    description: '',
  });

  // Check authorization
  useEffect(() => {
    // Only redirect if role loading is complete and user is not staff/admin
    if (roleLoading === false && role && role !== 'staff' && role !== 'admin') {
      router.push('/dashboard');
    }
  }, [role, roleLoading, router]);

  // Fetch staff users
  useEffect(() => {
    const fetchStaffUsers = async () => {
      try {
        setStaffLoading(true);
        const response = await fetch(`${getApiUrl()}/api/staff-users`);
        const data = await response.json();

        if (response.ok) {
          setStaffUsers(data.staff_users || []);
          console.log('Fetched staff users:', data.staff_users);
        } else {
          console.error('Failed to fetch staff users:', data.error);
        }
      } catch (err) {
        console.error('Error fetching staff users:', err);
      } finally {
        setStaffLoading(false);
      }
    };

    fetchStaffUsers();
  }, []);

  // Fetch current user as fallback
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/me`);
        const data = await response.json();
        if (response.ok) {
          const displayName = data.user_metadata?.display_name || 
                             (data.user_metadata?.first_name && data.user_metadata?.last_name 
                               ? `${data.user_metadata.first_name} ${data.user_metadata.last_name}`
                               : data.user_metadata?.first_name);
          setCurrentUser({ 
            id: data.id, 
            email: data.email,
            name: displayName 
          });
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${getApiUrl()}/api/classes`);
        const data = await response.json();

        if (response.ok) {
          setClasses(data.classes || []);
        } else {
          setError(data.error || 'Failed to load classes');
        }
      } catch (err) {
        setError('Network error loading classes');
        console.error('Error fetching classes:', err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if role is loaded and user is staff/admin
    if (!roleLoading && (role === 'staff' || role === 'admin')) {
      fetchClasses();
    }
  }, [role, roleLoading]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'max_participants' ? parseInt(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = `${getApiUrl()}/api/classes`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editingId ? { ...formData, id: editingId } : formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh classes list
        const refreshRes = await fetch(`${getApiUrl()}/api/classes`);
        const refreshData = await refreshRes.json();
        if (refreshRes.ok) {
          setClasses(refreshData.classes || []);
        }

        setShowForm(false);
        setEditingId(null);
        setFormData({
          class_name: '',
          class_type: '',
          instructor: '',
          start: '',
          end: '',
          location: '',
          max_participants: 20,
          description: '',
        });
      } else {
        setError(data.error || `Failed to ${editingId ? 'update' : 'create'} class`);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (fitnessClass: DatabaseClass) => {
    setFormData(fitnessClass);
    setEditingId(fitnessClass.id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this class?')) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${getApiUrl()}/api/classes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setClasses(classes.filter((c) => c.id !== id));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete class');
      }
    } catch (err) {
      setError('Network error deleting class');
      console.error('Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      class_name: '',
      class_type: '',
      instructor: '',
      start: '',
      end: '',
      location: '',
      max_participants: 20,
      description: '',
    });
  };

  if (roleLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span style={{ marginLeft: '1rem' }}>Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard/classes">
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: '#4f46e5',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classes
          </button>
        </Link>

        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>
          Manage Classes
        </h1>
        <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
          Create, edit, and delete fitness classes
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '0.5rem',
            color: '#991b1b',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div
          style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            {editingId ? 'Edit Class' : 'Create New Class'}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#1f2937' }}>
                  Class Name *
                </label>
                <input
                  type="text"
                  name="class_name"
                  value={formData.class_name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    color: '#1f2937',
                  }}
                  placeholder="e.g., Morning Yoga"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#1f2937' }}>
                  Class Type *
                </label>
                <select
                  name="class_type"
                  value={formData.class_type}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    color: 'black',
                  }}
                >
                  <option value="">Select type</option>
                  {classTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#1f2937' }}>
                  Instructor *
                </label>
                <select
                  name="instructor"
                  value={formData.instructor}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    color: 'Black',
                  }}
                >
                  <option value="">Select an instructor</option>
                  {staffUsers.length > 0 ? (
                    staffUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))
                  ) : currentUser ? (
                    <option value={currentUser.id}>
                      {currentUser.name || currentUser.email} (You - Staff)
                    </option>
                  ) : (
                    <option disabled>No staff users available</option>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#1f2937' }}>
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    color: 'black',
                  }}
                  placeholder="e.g., Studio A"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#1f2937' }}>
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  name="start"
                  value={formData.start}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    color: 'black',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#1f2937' }}>
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  name="end"
                  value={formData.end}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    color: '#1f2937',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#1f2937' }}>
                  Max Participants *
                </label>
                <input
                  type="number"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleInputChange}
                  required
                  min="1"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    color: '#1f2937',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#1f2937' }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  minHeight: '100px',
                  fontFamily: 'inherit',
                  color: '#1f2937',
                }}
                placeholder="Class description..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  opacity: submitting ? 0.5 : 1,
                }}
              >
                {submitting ? 'Saving...' : editingId ? 'Update Class' : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Class Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            marginBottom: '2rem',
          }}
        >
          <Plus className="w-4 h-4" />
          Add New Class
        </button>
      )}

      {/* Classes Table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            color: '#111827', // force dark text so it stays visible on white background
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>Name</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>Type</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>Start Time</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>Location</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>Capacity</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#4b5563',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  No classes yet. Click "Add New Class" to create one.
                </td>
              </tr>
            ) : (
              classes.map((fitnessClass) => (
                <tr key={fitnessClass.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#111827' }}>{fitnessClass.class_name}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#111827' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                      }}
                    >
                      {fitnessClass.class_type}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#111827' }}>
                    {new Date(fitnessClass.start).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#111827' }}>{fitnessClass.location}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#111827' }}>
                    {fitnessClass.participants?.length || 0} / {fitnessClass.max_participants}
                  </td>
                  <td
                    style={{
                      padding: '1rem',
                      textAlign: 'center',
                      display: 'flex',
                      gap: '0.5rem',
                      justifyContent: 'center',
                    }}
                  >
                    <button
                      onClick={() => handleEdit(fitnessClass)}
                      disabled={submitting}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#dbeafe',
                        color: '#1e3a8a',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(fitnessClass.id!)}
                      disabled={submitting}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
