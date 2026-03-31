'use client';

import { useEffect, useState } from 'react';
import { getAllUsers } from '@/actions/users';

type UserData = {
  id: number;
  nickname: string;
  firstName: string;
  lastName: string;
  amount: number;
};

export default function UserSelector() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [activeUser, setActiveUser] = useState<UserData | null>(null);

  useEffect(() => {
    getAllUsers().then(data => {
      setUsers(data);
      // Load saved user from local storage
      const saved = localStorage.getItem('keyvault-user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = data.find(u => u.id === parsed.id);
        if (match) setActiveUser(match);
      } else if (data.length > 0) {
        setActiveUser(data[0]);
        localStorage.setItem('keyvault-user', JSON.stringify(data[0]));
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = Number(e.target.value);
    const user = users.find(u => u.id === userId);
    if (user) {
      setActiveUser(user);
      localStorage.setItem('keyvault-user', JSON.stringify(user));
      window.location.reload(); // Refresh the page to simulate login
    }
  };

  if (!activeUser) return <div className="user-selector-loading" />;

  return (
    <div className="user-selector">
      <div className="user-selector-avatar">
        {activeUser.firstName[0]}
      </div>
      <select value={activeUser.id} onChange={handleChange} className="user-select-input">
        {users.map(u => (
          <option key={u.id} value={u.id}>
            @{u.nickname} (${u.amount.toFixed(2)})
          </option>
        ))}
      </select>
    </div>
  );
}
