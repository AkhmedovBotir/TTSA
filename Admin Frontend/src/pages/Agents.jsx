import { useState, useEffect } from 'react';
import CreateAgentModal from '../components/Agents/CreateAgentModal';
import Snackbar from '../components/Common/Snackbar';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import EditAgentModal from '../components/Agents/EditAgentModal';
import DeleteAgentModal from '../components/Agents/DeleteAgentModal';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });
  const token = localStorage.getItem('token');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
              const response = await fetch('https://api.ttsa.uz/api/agent/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Agentlarni yuklashda xatolik yuz berdi');
      setAgents(data.agents);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    fetchAgents();
    setSnackbar({ open: true, message: 'Agent muvaffaqiyatli yaratildi', type: 'success' });
  };

  const handleEditSuccess = () => {
    fetchAgents();
    setSnackbar({ open: true, message: 'Agent muvaffaqiyatli yangilandi', type: 'success' });
  };

  const handleDeleteSuccess = () => {
    fetchAgents();
    setSnackbar({ open: true, message: "Agent muvaffaqiyatli o'chirildi", type: 'success' });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        onClose={handleSnackbarClose}
        open={snackbar.open}
      />
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Agentlar
          </h2>
          <p className="text-sm text-gray-600 mt-1">Agentlar ro'yxati va boshqaruvi</p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <PlusIcon className="h-5 w-5" />
            Yangi agent
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ism</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passport</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {agents.map(agent => (
              <tr key={agent.id}>
                <td className="px-6 py-4 whitespace-nowrap">{agent.fullname}</td>
                <td className="px-6 py-4 whitespace-nowrap">{agent.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">{agent.passport}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={agent.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      try {
                        const response = await fetch(`https://api.ttsa.uz/api/agent/${agent.id}/status`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ status: newStatus })
                        });
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.message || "Statusni o'zgartirishda xatolik yuz berdi");
                        fetchAgents();
                        setSnackbar({ open: true, message: "Agent statusi muvaffaqiyatli o'zgartirildi", type: 'success' });
                      } catch (error) {
                        setSnackbar({ open: true, message: error.message, type: 'error' });
                      }
                    }}
                    className={`px-2 py-1 rounded-md border font-semibold focus:outline-none transition-colors duration-200
                      ${agent.status === 'active' ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                        : agent.status === 'inactive' ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200'
                        : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'}
                    `}
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Faol emas</option>
                    <option value="blocked">Bloklangan</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors duration-200 mr-2"
                    onClick={() => { setSelectedAgent(agent); setIsEditModalOpen(true); }}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors duration-200"
                    onClick={() => { setSelectedAgent(agent); setIsDeleteModalOpen(true); }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateAgentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
          token={token}
        />
      )}
      {/* Edit Modal */}
      {isEditModalOpen && selectedAgent && (
        <EditAgentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          agent={selectedAgent}
          onSuccess={handleEditSuccess}
          token={token}
        />
      )}
      {/* Delete Modal */}
      {isDeleteModalOpen && selectedAgent && (
        <DeleteAgentModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          agent={selectedAgent}
          onSuccess={handleDeleteSuccess}
          token={token}
        />
      )}
    </div>
  );
};

export default Agents; 