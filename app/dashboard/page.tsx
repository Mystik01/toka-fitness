export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Dashboard Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Dashboard Overview
        </h2>
        <p className="text-gray-600">
          Welcome to your dashboard! Use the navigation sidebar to explore different sections.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Workouts</h3>
          <p className="text-gray-600 mb-4">Track and manage your workout routines.</p>
          <a
            href="/dashboard/workouts"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            View Workouts
          </a>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nutrition</h3>
          <p className="text-gray-600 mb-4">Monitor your nutrition and diet plans.</p>
          <a
            href="/dashboard/nutrition"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            View Nutrition
          </a>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Account</h3>
          <p className="text-gray-600 mb-4">Manage your account settings and preferences.</p>
          <a
            href="/dashboard/account"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Account Settings
          </a>
        </div>
      </div>
    </div>
  );
}
