import { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, Trash2, AlertTriangle } from 'lucide-react';
import { AppSettings } from '../types';
import { DataManager } from '../utils/dataManager';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: () => void;
}

export default function Settings({ isOpen, onClose, onSettingsChange }: SettingsProps) {
  const [settings, setSettings] = useState<AppSettings>({
    showSkill: true,
    showGender: true,
    showAge: true,
    maxGroupsPerLocation: 8,
    defaultCollapseGroups: false,
    teamClampRule: 'conservative',
    defaultAlgorithm: 'balanced',
    persistFilters: true,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showToast, setShowToast] = useState(false);

  const dataManager = DataManager.getInstance();

  useEffect(() => {
    if (isOpen) {
      setSettings(dataManager.getSettings());
    }
  }, [isOpen]);

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    dataManager.updateSettings({ [key]: value });
    onSettingsChange?.();
  };

  const handleDeleteAllPeople = () => {
    if (deleteConfirmText !== 'DELETE') return;
    
    dataManager.deleteAllMembers();
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    onSettingsChange?.(); // Refresh the UI
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40" 
        onClick={onClose}
      />

      {/* Settings modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#3a3a3a]">
            <div className="flex items-center space-x-2">
              <SettingsIcon size={20} className="text-[#f2ebc4]" />
              <h2 className="text-xl font-semibold text-[#f2ebc4]">Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-[#f2ebc4] hover:bg-[#2a2a2a] rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Settings content */}
          <div className="p-6 space-y-6">
            {/* Display Options */}
            <div>
              <h3 className="text-lg font-medium text-[#f2ebc4] mb-4">Display Options</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-[#f2ebc4]">Show Skill Level</span>
                  <input
                    type="checkbox"
                    checked={settings.showSkill}
                    onChange={(e) => handleSettingChange('showSkill', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-[#f2ebc4]">Show Gender</span>
                  <input
                    type="checkbox"
                    checked={settings.showGender}
                    onChange={(e) => handleSettingChange('showGender', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-[#f2ebc4]">Show Age</span>
                  <input
                    type="checkbox"
                    checked={settings.showAge}
                    onChange={(e) => handleSettingChange('showAge', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                </label>
              </div>
            </div>

            {/* Group Settings */}
            <div>
              <h3 className="text-lg font-medium text-[#f2ebc4] mb-4">Group Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#f2ebc4] mb-2">Max Groups per Location</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.maxGroupsPerLocation}
                    onChange={(e) => handleSettingChange('maxGroupsPerLocation', Math.min(50, Math.max(1, parseInt(e.target.value) || 8)))}
                    className="w-full bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2 focus:outline-none focus:border-[#f2e205]"
                  />
                  <p className="text-sm text-gray-400 mt-1">Maximum 50 groups allowed</p>
                </div>
                <label className="flex items-center justify-between">
                  <span className="text-[#f2ebc4]">Default Collapse Groups</span>
                  <input
                    type="checkbox"
                    checked={settings.defaultCollapseGroups}
                    onChange={(e) => handleSettingChange('defaultCollapseGroups', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                </label>
              </div>
            </div>

            {/* Team Generation */}
            <div>
              <h3 className="text-lg font-medium text-[#f2ebc4] mb-4">Team Generation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#f2ebc4] mb-2">Team Count Rule</label>
                  <select
                    value={settings.teamClampRule}
                    onChange={(e) => handleSettingChange('teamClampRule', e.target.value as 'conservative' | 'relaxed')}
                    className="w-full bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2 focus:outline-none focus:border-[#f2e205]"
                  >
                    <option value="conservative">Conservative (people ÷ 2)</option>
                    <option value="relaxed">Relaxed (up to people count)</option>
                  </select>
                  <p className="text-sm text-gray-400 mt-1">
                    How many teams can be created based on available people
                  </p>
                </div>
                <div>
                  <label className="block text-[#f2ebc4] mb-2">Default Algorithm</label>
                  <select
                    value={settings.defaultAlgorithm}
                    onChange={(e) => handleSettingChange('defaultAlgorithm', e.target.value)}
                    className="w-full bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2 focus:outline-none focus:border-[#f2e205]"
                  >
                    <option value="balanced">Balanced</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Other Settings */}
            <div>
              <h3 className="text-lg font-medium text-[#f2ebc4] mb-4">Other</h3>
              <label className="flex items-center justify-between">
                <span className="text-[#f2ebc4]">Persist Filters Between Sessions</span>
                <input
                  type="checkbox"
                  checked={settings.persistFilters}
                  onChange={(e) => handleSettingChange('persistFilters', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
              </label>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-[#3a3a3a] pt-6">
              <h3 className="text-lg font-medium text-red-400 mb-4 flex items-center space-x-2">
                <AlertTriangle size={18} />
                <span>Danger Zone</span>
              </h3>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Trash2 size={18} />
                <span>Clear All People</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-75 z-60" />
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] rounded-xl max-w-md w-full p-6">
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle size={24} className="text-red-400" />
                <h3 className="text-xl font-semibold text-[#f2ebc4]">Delete ALL people?</h3>
              </div>
              <p className="text-[#f2ebc4] mb-4">
                This will permanently remove all members across all locations. This cannot be undone.
              </p>
              <div className="mb-4">
                <label className="block text-[#f2ebc4] mb-2">
                  Type <span className="font-mono font-bold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-3 py-2 focus:outline-none focus:border-red-400"
                  placeholder="Type DELETE here"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteAllPeople}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  I understand – delete everyone
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="px-4 py-2 text-[#f2ebc4] border border-[#3a3a3a] rounded-lg hover:bg-[#2a2a2a] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Success toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-80 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
          All people deleted.
        </div>
      )}
    </>
  );
}