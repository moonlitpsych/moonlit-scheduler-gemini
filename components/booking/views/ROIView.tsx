import React, { useState } from 'react';
import { ROIContact } from '../../../types';

interface ROIViewProps {
  contacts: ROIContact[];
  onSave: (contacts: ROIContact[]) => void;
  onSkip: () => void;
}

export const ROIView: React.FC<ROIViewProps> = ({ contacts: initialContacts, onSave, onSkip }) => {
  const [contacts, setContacts] = useState<ROIContact[]>(initialContacts);
  const [currentName, setCurrentName] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentRelation, setCurrentRelation] = useState('');

  const addContact = () => {
    if (!currentName || !currentEmail) return;
    const newContact: ROIContact = {
        id: crypto.randomUUID(),
        name: currentName,
        email: currentEmail,
        relationship: currentRelation,
        phone: '',
        notifyOfAppointment: true
    };
    setContacts([...contacts, newContact]);
    setCurrentName('');
    setCurrentEmail('');
    setCurrentRelation('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Release of Information (ROI)</h2>
        <p className="text-slate-600 mt-2">
            Please add any case managers, family members, or other providers who should be kept in the loop regarding this appointment.
        </p>
      </div>

      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
        <h3 className="font-medium text-slate-800">Add Contact</h3>
        <div className="grid grid-cols-1 gap-4">
            <input 
                type="text" 
                placeholder="Full Name" 
                className="w-full p-2 border rounded"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
            />
            <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full p-2 border rounded"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
            />
            <input 
                type="text" 
                placeholder="Relationship (e.g., Case Manager)" 
                className="w-full p-2 border rounded"
                value={currentRelation}
                onChange={(e) => setCurrentRelation(e.target.value)}
            />
            <button 
                onClick={addContact}
                disabled={!currentName || !currentEmail}
                className="bg-white border border-indigo-600 text-indigo-600 py-2 rounded font-medium hover:bg-indigo-50 disabled:opacity-50"
            >
                Add Contact
            </button>
        </div>
      </div>

      {contacts.length > 0 && (
        <div className="space-y-3">
            <h3 className="font-medium text-slate-800">Contacts to Notify</h3>
            {contacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between bg-white p-3 border rounded shadow-sm">
                    <div>
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-gray-500">{contact.relationship} • {contact.email}</div>
                    </div>
                    <button 
                        onClick={() => setContacts(contacts.filter(c => c.id !== contact.id))}
                        className="text-red-500 text-sm hover:underline"
                    >
                        Remove
                    </button>
                </div>
            ))}
        </div>
      )}

      <div className="flex gap-4 pt-4 border-t">
        <button 
            onClick={onSkip} 
            className="flex-1 py-3 text-slate-500 hover:bg-slate-50 rounded"
        >
            Skip this step
        </button>
        <button 
            onClick={() => onSave(contacts)} 
            className="flex-1 py-3 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 shadow-sm"
        >
            Continue with {contacts.length} Contact{contacts.length !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
};