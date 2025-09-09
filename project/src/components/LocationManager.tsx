import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, MapPin, Edit2, Trash2, Users } from 'lucide-react';
import { AppScreen, Location } from '../types';
import { DataManager } from '../utils/dataManager';

interface LocationManagerProps {
  onNavigate: (screen: AppScreen, data?: any) => void;
}

export default function LocationManager({ onNavigate }: LocationManagerProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [error, setError] = useState('');

  const dataManager = DataManager.getInstance();

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = () => {
    setLocations(dataManager.getLocations());
  };

  const handleAddLocation = () => {
    if (!newLocationName.trim()) {
      setError('Location name is required');
      return;
    }

    try {
      dataManager.addLocation(newLocationName.trim());
      setNewLocationName('');
      setShowAddForm(false);
      setError('');
      loadLocations();
    } catch (err) {
      setError('Failed to add location');
    }
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setNewLocationName(location.name);
  };

  const handleUpdateLocation = () => {
    if (!editingLocation || !newLocationName.trim()) return;

    dataManager.updateLocation(editingLocation.id, newLocationName.trim());
    setEditingLocation(null);
    setNewLocationName('');
    loadLocations();
  };

  const handleDeleteLocation = (locationId: string) => {
    if (confirm('Are you sure you want to delete this location? All members will be removed.')) {
      dataManager.deleteLocation(locationId);
      loadLocations();
    }
  };

  const handleLocationSelect = (location: Location) => {
    onNavigate('members', { locationId: location.id });
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f2ebc4]">
      {/* Header */}
      <div className="bg-[#f2e205] text-[#0d0d0d] p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 hover:bg-[#0d0d0d] hover:bg-opacity-10 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-semibold">Locations</h1>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-[#0d0d0d] text-[#f2e205] p-2 rounded-lg hover:bg-opacity-80 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="p-4">
        {/* Add/Edit Form */}
        {(showAddForm || editingLocation) && (
          <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Location name"
                value={newLocationName}
                onChange={(e) => {
                  setNewLocationName(e.target.value);
                  setError('');
                }}
                className="w-full bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-4 py-3 focus:outline-none focus:border-[#f2e205]"
                autoFocus
              />
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={editingLocation ? handleUpdateLocation : handleAddLocation}
                  className="flex-1 bg-[#f2e205] text-[#0d0d0d] py-3 rounded-lg font-semibold hover:bg-[#e6d600] transition-colors"
                >
                  {editingLocation ? 'Update' : 'Add Location'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingLocation(null);
                    setNewLocationName('');
                    setError('');
                  }}
                  className="px-6 py-3 text-[#f2ebc4] border border-[#3a3a3a] rounded-lg hover:bg-[#2a2a2a] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Locations List */}
        {locations.length === 0 ? (
          <div className="text-center py-12">
            <MapPin size={64} className="mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-semibold mb-2">No locations yet</h3>
            <p className="text-opacity-60 mb-6">
              Add your first location to start managing teams
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-[#f2e205] text-[#0d0d0d] px-6 py-3 rounded-lg font-semibold hover:bg-[#e6d600] transition-colors"
            >
              Add Location
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {locations.map((location) => (
              <div
                key={location.id}
                className="bg-[#1a1a1a] rounded-xl p-4 hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                onClick={() => handleLocationSelect(location)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-[#f2e205] bg-opacity-20 p-2 rounded-lg">
                      <MapPin size={20} className="text-[#f2e205]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{location.name}</h3>
                      <div className="flex items-center space-x-1 text-sm opacity-60">
                        <Users size={14} />
                        <span>{location.members.length} members</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditLocation(location);
                      }}
                      className="p-2 text-[#f2e205] hover:bg-[#f2e205] hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLocation(location.id);
                      }}
                      className="p-2 text-red-400 hover:bg-red-400 hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Continue to Team Generation */}
        {locations.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#3a3a3a]">
            <button
              onClick={() => onNavigate('team-generator')}
              className="w-full bg-[#f2e205] text-[#0d0d0d] py-4 rounded-xl font-semibold hover:bg-[#e6d600] transition-colors"
            >
              Continue to Team Generation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}