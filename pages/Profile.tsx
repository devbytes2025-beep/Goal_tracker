import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { Card, Button, Input, Select } from '../components/UI';
import { User as UserIcon, Camera, Save, Trophy, Mail } from 'lucide-react';
import { backend } from '../services/mockBackend';
import { playSound } from '../constants';
import { User } from '../types';

const Profile: React.FC = () => {
  const { user, updateUser, showToast } = useApp();
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
      if (user) {
          setFormData({
              username: user.username,
              name: user.name || '',
              bio: user.bio || '',
              gender: user.gender || 'Prefer not to say',
              dob: user.dob || '',
              avatar: user.avatar || '',
              email: user.email
          });
      }
  }, [user]);

  const handleSave = async () => {
      if (!user) return;
      try {
          const updated = { ...user, ...formData };
          await backend.updateUser(updated as User);
          updateUser(updated as User); // Update context
          showToast("Profile updated successfully!", 'success');
          playSound('success');
          setIsEditing(false);
      } catch (e: any) { 
          console.error(e); 
          showToast(e.message || "Failed to update profile", 'error');
      }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setFormData(prev => ({ ...prev, avatar: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="text-center py-8 relative">
        <div className="relative inline-block group">
             <div className="w-32 h-32 bg-gradient-to-tr from-pink-500 to-violet-500 rounded-full mx-auto flex items-center justify-center text-4xl font-bold shadow-2xl mb-6 overflow-hidden">
                {formData.avatar ? (
                    <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    user.username.charAt(0).toUpperCase()
                )}
            </div>
            {isEditing && (
                <label className="absolute bottom-6 right-0 bg-white/20 p-2 rounded-full cursor-pointer hover:bg-white/40 transition-colors backdrop-blur-md">
                    <Camera size={20} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </label>
            )}
        </div>
        
        {!isEditing ? (
             <>
                <h2 className="text-3xl font-bold">{user.name || user.username}</h2>
                <div className="flex items-center justify-center gap-2 mt-2 text-yellow-400 font-bold">
                    <Trophy size={16} />
                    <span>{user.points || 0} Points</span>
                </div>
                <p className="text-gray-400 mt-1">@{user.username}</p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-1">
                    <Mail size={12} />
                    {user.email}
                </div>
                <Button variant="ghost" className="mt-4" onClick={() => setIsEditing(true)}>Edit Profile</Button>
             </>
        ) : (
            <div className="flex justify-center gap-2 mt-4">
                 <Button onClick={handleSave} className="flex gap-2"><Save size={18} /> Save</Button>
                 <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
            <h3 className="text-gray-400 text-sm mb-2">Display Name</h3>
            {isEditing ? (
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            ) : (
                <p className="font-medium">{user.name || 'Not set'}</p>
            )}
        </Card>

        <Card>
            <h3 className="text-gray-400 text-sm mb-2">Email Address</h3>
            {isEditing ? (
                <div>
                    <Input 
                        type="email"
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                    />
                    <p className="text-[10px] text-yellow-500 mt-1">Changing this will require verification on next login.</p>
                </div>
            ) : (
                <p className="font-medium">{user.email}</p>
            )}
        </Card>
        
        <Card>
            <h3 className="text-gray-400 text-sm mb-2">Gender</h3>
             {isEditing ? (
                <Select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                </Select>
            ) : (
                <p className="font-medium">{user.gender || 'Not specified'}</p>
            )}
        </Card>

        <Card>
            <h3 className="text-gray-400 text-sm mb-2">Date of Birth</h3>
             {isEditing ? (
                <Input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
            ) : (
                <p className="font-medium">{user.dob || 'Not set'}</p>
            )}
        </Card>

        <Card className="md:col-span-2">
            <h3 className="text-gray-400 text-sm mb-2">Bio</h3>
             {isEditing ? (
                <textarea 
                    className="w-full glass-input p-3 rounded-xl resize-none" 
                    rows={3}
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                />
            ) : (
                <p className="italic text-gray-200">{user.bio || "No bio set yet."}</p>
            )}
        </Card>
      </div>
    </div>
  );
};

export default Profile;