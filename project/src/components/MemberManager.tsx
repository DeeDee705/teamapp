import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, User, Edit2, Trash2, Star } from 'lucide-react';
import { AppScreen, Member, Location } from '../types';
import { DataManager } from '../utils/dataManager';

interface MemberManagerProps {
  locationId: string;
  onNavigate: (screen: AppScreen, data?: any) => void;
}

export default function MemberManager({ locationId, onNavigate }: MemberManagerProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    birthYear: new Date().getFullYear() - 25,
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    skillLevel: 3 as 1 | 2 | 3 | 4 | 5
  });
  const [error, setError] = useState('');

  const dataManager = DataManager.getInstance();

  useEffect(() => {
    loadLocation();
  }, [locationId]);

  const loadLocation = () => {
    const locations = dataManager.getLocations();
    const found = locations.find(loc => loc.id === locationId);
    setLocation(found || null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      birthYear: new Date().getFullYear() - 25,
      gender: 'Male',
      skillLevel: 3 as 1 | 2 | 3 | 4 | 5
    });
    setError('');
  };

  const handleAddMember = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (formData.birthYear < 1900 || formData.birthYear > new Date().getFullYear()) {
      setError('Please enter a valid birth year');
      return;
    }

    try {
      dataManager.addMember(locationId, {
        ...formData,
        name: formData.name.trim(),
        isPresent: true
      });
      
      setShowAddForm(false);
      resetForm();
      loadLocation();
    } catch (err) {
      setError('Failed to add member');
    }
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      birthYear: member.birthYear,
      gender: member.gender,
      skillLevel: member.skillLevel
    });
  };

  const handleUpdateMember = () => {
    if (!editingMember || !formData.name.trim()) return;

    dataManager.updateMember(locationId, editingMember.id, {
      ...formData,
      name: formData.name.trim()
    });
    
    setEditingMember(null);
    resetForm();
    loadLocation();
  };

  const handleDeleteMember = (memberId: string) => {
    if (confirm('Are you sure you want to delete this member?')) {
      dataManager.deleteMember(locationId, memberId);
      loadLocation();
    }
  };

  const handleTogglePresence = (member: Member) => {
    dataManager.updateMemberPresence(locationId, member.id, !member.isPresent);
    loadLocation();
  };

  const getSkillStars = (level: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < level ? 'text-[#f2e205] fill-current' : 'text-gray-500'}
      />
    ));
  };

  if (!location) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-[#f2ebc4] flex items-center justify-center">
        <p>Location not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f2ebc4]">
      {/* Header */}
      <div className="bg-[#f2e205] text-[#0d0d0d] p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('locations')}
            className="p-2 hover:bg-[#0d0d0d] hover:bg-opacity-10 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold">{location.name}</h1>
            <p className="text-sm opacity-80">{location.members.length} members</p>
          </div>
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
        {(showAddForm || editingMember) && (
          <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingMember ? 'Edit Member' : 'Add New Member'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  type="text"
                  placeholder="Member name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setError('');
                  }}
                  className="w-full bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-4 py-3 focus:outline-none focus:border-[#f2e205]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Birth Year</label>
                <input
                  type="number"
                  value={formData.birthYear}
                  onChange={(e) => setFormData({ ...formData, birthYear: parseInt(e.target.value) })}
                  className="w-full bg-[#2a2a2a] text-[#f2ebc4] border border-[#3a3a3a] rounded-lg px-4 py-3 focus:outline-none focus:border-[#f2e205]"
                  min="1900"
                  max={new Date().getFullYear()}
                />
                <p className="text-xs opacity-60 mt-1">
                  Age: {new Date().getFullYear() - formData.birthYear} years
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Gender</label>
                <div className="flex space-x-2">
                  {['Male', 'Female', 'Other'].map((gender) => (
                    <button
                      key={gender}
                      onClick={() => setFormData({ ...formData, gender: gender as any })}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        formData.gender === gender
                          ? 'bg-[#f2e205] text-[#0d0d0d]'
                          : 'bg-[#2a2a2a] text-[#f2ebc4] hover:bg-[#3a3a3a]'
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Skill Level: {formData.skillLevel}
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setFormData({ ...formData, skillLevel: level as 1 | 2 | 3 | 4 | 5 })}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        formData.skillLevel === level
                          ? 'bg-[#f2e205] text-[#0d0d0d]'
                          : 'bg-[#2a2a2a] text-[#f2ebc4] hover:bg-[#3a3a3a]'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="flex justify-center mt-2">
                  {getSkillStars(formData.skillLevel)}
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={editingMember ? handleUpdateMember : handleAddMember}
                  className="flex-1 bg-[#f2e205] text-[#0d0d0d] py-3 rounded-lg font-semibold hover:bg-[#e6d600] transition-colors"
                >
                  {editingMember ? 'Update Member' : 'Add Member'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingMember(null);
                    resetForm();
                  }}
                  className="px-6 py-3 text-[#f2ebc4] border border-[#3a3a3a] rounded-lg hover:bg-[#2a2a2a] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Members List */}
        {location.members.length === 0 ? (
          <div className="text-center py-12">
            <User size={64} className="mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-semibold mb-2">No members yet</h3>
            <p className="opacity-60 mb-6">
              Add members to start creating teams
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-[#f2e205] text-[#0d0d0d] px-6 py-3 rounded-lg font-semibold hover:bg-[#e6d600] transition-colors"
            >
              Add First Member
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {location.members.map((member) => (
              <div
                key={member.id}
                className={`rounded-xl p-4 transition-all ${
                  member.isPresent 
                    ? 'bg-[#1a1a1a] hover:bg-[#2a2a2a]' 
                    : 'bg-[#1a1a1a] bg-opacity-50 hover:bg-opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <button
                      onClick={() => handleTogglePresence(member)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        member.isPresent
                          ? 'bg-[#f2e205] border-[#f2e205]'
                          : 'border-gray-500 hover:border-[#f2e205]'
                      }`}
                    >
                      {member.isPresent && (
                        <div className="w-2 h-2 bg-[#0d0d0d] rounded-full"></div>
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className={`font-semibold ${!member.isPresent ? 'opacity-50' : ''}`}>
                          {member.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          member.gender === 'Male' ? 'bg-blue-500 bg-opacity-20 text-blue-300' :
                          member.gender === 'Female' ? 'bg-pink-500 bg-opacity-20 text-pink-300' :
                          'bg-purple-500 bg-opacity-20 text-purple-300'
                        }`}>
                          {member.gender}
                        </span>
                      </div>
                      <div className={`flex items-center space-x-4 text-sm mt-1 ${!member.isPresent ? 'opacity-50' : 'opacity-60'}`}>
                        <span>Age: {new Date().getFullYear() - member.birthYear}</span>
                        <div className="flex items-center space-x-1">
                          <span>Skill:</span>
                          <div className="flex">
                            {getSkillStars(member.skillLevel)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditMember(member)}
                      className="p-2 text-[#f2e205] hover:bg-[#f2e205] hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member.id)}
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
      </div>
    </div>
  );
}