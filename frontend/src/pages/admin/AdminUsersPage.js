import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await authService.getAllUsers();
        setUsers(usersData);
      } catch (err) {
        setError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleViewData = (userId) => {
    navigate(`/admin/user/${userId}`);
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 bg-gradient-mesh flex items-center justify-center">
        <div className="card-glass p-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
          <div className="text-xl font-medium text-gray-600">Loading Users...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 bg-gradient-mesh flex items-center justify-center">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-xl shadow-md font-bold">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-mesh py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="card-glass p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t-4 border-t-rose-500">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-red-600 tracking-tight flex items-center gap-3">
              <span className="text-gray-900">🛡️</span> User Management
            </h1>
            <p className="text-gray-500 mt-1 font-medium ml-12">
              Manage all registered users in the system
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-all shadow-sm flex items-center gap-2"
          >
            <span>←</span> Logout
          </button>
        </div>

        {/* Table */}
        <div className="card-glass overflow-hidden pointer-events-auto">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    User Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:table-cell">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white/40">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${
                          user.role === 'admin' ? 'bg-gradient-to-br from-rose-400 to-red-500' : 'bg-gradient-to-br from-indigo-400 to-purple-500'
                        }`}>
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{user.name || 'N/A'}</p>
                          <p className="text-xs font-medium text-gray-500">{user.email}</p>
                          
                          {/* Mobile-only info */}
                          <div className="sm:hidden mt-1 flex gap-2">
                            <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide ${
                              user.role === 'admin' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${
                        user.role === 'admin'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 hidden md:table-cell">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleViewData(user.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition-colors text-sm"
                      >
                        View Data <span>→</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminUsersPage;