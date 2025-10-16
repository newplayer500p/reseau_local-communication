import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api, API_BASE } from '../../../service/axios.service';

const AdminUsersDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  const url = API_BASE;

  // Statuts disponibles
  const statusOptions = ['Utilisateur', 'Responsable', 'EnCours', 'Admin'];

  // Icônes en tant que composants React pour éviter la dépendance SVG externe
  const CloseIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );

  const DeleteIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );

  const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  );

  // Récupérer l'email de l'utilisateur actuel une seule fois
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        // Décoder le JWT pour obtenir l'email de l'utilisateur actuel
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserEmail(payload.email || '');
      } catch (err) {
        console.error('Erreur lors du décodage du token:', err);
      }
    }
  }, []);

  // Effacer les messages après un délai - optimisé pour éviter les boucles
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError('');
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  // Récupérer les utilisateurs depuis l'API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/user/admin/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        setUsers(response.data);
      } catch (err) {
        console.error('Erreur lors de la récupération des utilisateurs:', err);
        const errorMessage = err.response?.data?.message || 'Impossible de charger les utilisateurs';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Fonction pour mettre à jour le statut d'un utilisateur
  const updateUserStatus = useCallback(async (userEmail, newStatus) => {
    try {
      setError('');
      setSuccessMessage('');
      
      const response = await api.patch(
        `/user/admin/users/${userEmail}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );

      // Mettre à jour l'état local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.email === userEmail ? { ...user, ...response.data } : user
        )
      );
      
      setSuccessMessage('Statut utilisateur mis à jour avec succès');
      return true;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      const errorMessage = err.response?.data?.message || 'Impossible de mettre à jour le statut';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Fonction pour supprimer un utilisateur
  const deleteUser = useCallback(async (userEmail) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      
      await api.delete(`/user/admin/users/${userEmail}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      // Mettre à jour l'état local
      setUsers(prevUsers => prevUsers.filter(user => user.email !== userEmail));
      setSuccessMessage('Utilisateur supprimé avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      const errorMessage = err.response?.data?.message || 'Impossible de supprimer l\'utilisateur';
      setError(errorMessage);
    }
  }, []);

  // Filtrer et trier les utilisateurs avec useMemo pour éviter les re-calculs inutiles
  const filteredUsers = useMemo(() => {
    let result = [...users];
    
    // Appliquer le filtre de statut
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter);
    }
    
    return result;
  }, [users, statusFilter]);

  // Fonction pour vérifier si un utilisateur peut être supprimé
  const canDeleteUser = useCallback((user) => {
    // Ne peut pas supprimer les admins ou soi-même
    return user.status !== 'Admin' && user.email !== currentUserEmail;
  }, [currentUserEmail]);

  // Fonction pour vérifier si le statut peut être modifié
  const canModifyStatus = useCallback((user) => {
    // Ne peut pas modifier le statut d'un admin ou le sien
    return user.status !== 'Admin' && user.email !== currentUserEmail;
  }, [currentUserEmail]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6 sm:mb-8">
        Gestion des Utilisateurs
      </h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <span className="mb-2 sm:mb-0">{error}</span>
          <button 
            onClick={() => setError('')} 
            className="text-red-700 hover:text-red-900 self-end sm:self-auto"
          >
            <CloseIcon />
          </button>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <span className="mb-2 sm:mb-0">{successMessage}</span>
          <button 
            onClick={() => setSuccessMessage('')} 
            className="text-green-700 hover:text-green-900 self-end sm:self-auto"
          >
            <CloseIcon />
          </button>
        </div>
      )}
      
      {/* Filtres et contrôles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filtrer par statut
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <option value="all">Tous les statuts</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
          </div>
          
          <div className="lg:text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 py-2 px-4 rounded-lg text-center lg:text-right">
              {filteredUsers.length} utilisateur(s) trouvé(s)
            </p>
          </div>
        </div>
      </div>
      
      {/* Liste des utilisateurs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        {/* Vue desktop/tablette */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map(user => (
                <tr key={user._id || user.email} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img 
                          className="h-10 w-10 rounded-full object-cover" 
                          src={url + user.avatar} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${user.status === 'Admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 
                        user.status === 'Responsable' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        user.status === 'EnCours' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col xl:flex-row xl:space-x-2 space-y-2 xl:space-y-0">
                      {/* Menu déroulant pour changer le statut */}
                      {canModifyStatus(user) && (
                        <select
                          value={user.status}
                          onChange={(e) => updateUserStatus(user.email, e.target.value)}
                          className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1 px-2 border dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm"
                        >
                          {statusOptions.filter(status => status !== 'Admin').map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      )}
                      
                      {/* Bouton de suppression */}
                      {canDeleteUser(user) && (
                        <button
                          onClick={() => deleteUser(user.email)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors flex items-center justify-center"
                          title="Supprimer l'utilisateur"
                        >
                          <DeleteIcon />
                        </button>
                      )}
                      
                      {/* Message pour les utilisateurs protégés */}
                      {!canDeleteUser(user) && !canModifyStatus(user) && (
                        <span className="text-gray-500 dark:text-gray-400 text-xs italic">
                          Utilisateur protégé
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vue mobile - Cards */}
        <div className="sm:hidden">
          {filteredUsers.map(user => (
            <div key={user._id || user.email} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              <div className="p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <img 
                    className="h-12 w-12 rounded-full object-cover flex-shrink-0" 
                    src={url + user.avatar} 
                    alt={user.nom} 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.nom}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full
                      ${user.status === 'Admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 
                        user.status === 'Responsable' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        user.status === 'EnCours' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                      {user.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-2">
                  {canModifyStatus(user) && (
                    <select
                      value={user.status}
                      onChange={(e) => updateUserStatus(user.email, e.target.value)}
                      className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1 px-2 border dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm"
                    >
                      {statusOptions.filter(status => status !== 'Admin').map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  )}
                  
                  {canDeleteUser(user) && (
                    <button
                      onClick={() => deleteUser(user.email)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors p-2"
                      title="Supprimer l'utilisateur"
                    >
                      <DeleteIcon />
                    </button>
                  )}
                  
                  {/* Message pour les utilisateurs protégés en mobile */}
                  {!canDeleteUser(user) && !canModifyStatus(user) && (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400 text-xs italic">
                        Utilisateur protégé
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersDashboard;