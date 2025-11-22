import React, { useState, useCallback } from 'react';
import { BookingState, BookingScenario, ROIContact, TimeSlot, Payer, InsuranceInfo } from '../../types';
import { ROIView } from './views/ROIView';
import { submitBooking } from '../../services/bookingService';

// Mock components for brevity since we are focusing on the specific fixes
const WelcomeView = ({ onSelect }: { onSelect: (s: BookingScenario) => void }) => (
    <div className="space-y-4">
        <h2 className="text-2xl font-bold">Welcome to Moonlit Psychiatry</h2>
        <p>Who are you booking for?</p>
        <div className="flex gap-4">
            <button onClick={() => onSelect('self')} className="p-4 border rounded hover:bg-indigo-50">Myself</button>
            <button onClick={() => onSelect('case-manager')} className="p-4 border rounded hover:bg-indigo-50">I am a Case Manager</button>
        </div>
    </div>
);
const PayerSearchView = ({ onSelect }: { onSelect: (p: Payer) => void }) => (
    <div className="space-y-4">
        <h2 className="text-2xl font-bold">Select Insurance</h2>
        <button onClick={() => onSelect({ id: 'payer-1', name: 'Molina Utah' })} className="block w-full p-3 text-left border rounded hover:bg-gray-50">Molina Utah (Working)</button>
        <button onClick={() => onSelect({ id: 'payer-2', name: 'Aetna' })} className="block w-full p-3 text-left border rounded hover:bg-gray-50">Aetna (Fixed via SQL)</button>
    </div>
);
const CalendarView = ({ onSelect }: { onSelect: (t: TimeSlot) => void }) => (
    <div className="space-y-4">
        <h2 className="text-2xl font-bold">Select a Time</h2>
        <button onClick={() => onSelect({ start: new Date().toISOString(), end: new Date().toISOString(), providerId: 'prov-1', serviceInstanceId: 'srv-1' })} className="p-3 border rounded bg-indigo-600 text-white">Book Next Available</button>
    </div>
);
const InsuranceInfoView = ({ onSubmit }: { onSubmit: (i: InsuranceInfo) => void }) => (
    <div className="space-y-4">
        <h2 className="text-2xl font-bold">Insurance Details</h2>
        <button onClick={() => onSubmit({ memberId: '123', policyHolderName: 'John Doe', policyHolderDob: '1990-01-01' })} className="px-4 py-2 bg-indigo-600 text-white rounded">Submit Info</button>
    </div>
);
const AppointmentSummaryView = ({ state, onConfirm }: { state: BookingState; onConfirm: () => void }) => (
    <div className="space-y-4">
        <h2 className="text-2xl font-bold">Review Booking</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">{JSON.stringify(state, null, 2)}</pre>
        <button onClick={onConfirm} disabled={state.isSubmitting} className="px-6 py-3 bg-green-600 text-white rounded font-bold w-full">
            {state.isSubmitting ? 'Processing...' : 'Confirm Booking'}
        </button>
        {state.bookingError && <p className="text-red-600">{state.bookingError}</p>}
    </div>
);
const ConfirmationView = () => <div className="text-center text-green-600 text-2xl font-bold p-10">Booking Confirmed!</div>;

export const BookingFlow: React.FC = () => {
  const [state, setState] = useState<BookingState>({
    step: 'welcome',
    bookingScenario: 'self',
    roiContacts: [],
    bookingForSomeoneElse: false,
    isSubmitting: false
  });

  const handleWelcomeSelect = (scenario: BookingScenario) => {
    setState(prev => ({ 
        ...prev, 
        bookingScenario: scenario,
        bookingForSomeoneElse: scenario === 'case-manager' || scenario === 'third-party',
        step: 'payer-search' 
    }));
  };

  const handlePayerSelect = (payer: Payer) => {
    setState(prev => ({ ...prev, selectedPayer: payer, step: 'calendar' }));
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    setState(prev => ({ ...prev, selectedTimeSlot: slot, step: 'insurance-info' }));
  };

  const handleInsuranceSubmit = (info: InsuranceInfo) => {
    setState(prev => {
        // FIX: Logic to correctly route to ROI view instead of skipping it
        // If booking for someone else or strictly a case manager, we MUST collect ROI
        const shouldCollectROI = prev.bookingScenario === 'case-manager' || prev.bookingForSomeoneElse;
        
        return {
            ...prev,
            insuranceInfo: info,
            step: shouldCollectROI ? 'roi' : 'appointment-summary'
        };
    });
  };

  const handleROIUpdate = (contacts: ROIContact[]) => {
    setState(prev => ({
        ...prev,
        roiContacts: contacts,
        step: 'appointment-summary'
    }));
  };

  const handleConfirmBooking = async () => {
    setState(prev => ({ ...prev, isSubmitting: true, bookingError: undefined }));
    
    try {
        // Call the service which sends data to /api/patient-booking/book
        // Critical: This payload now includes roiContacts
        await submitBooking({
            providerId: state.selectedTimeSlot?.providerId!,
            serviceInstanceId: state.selectedTimeSlot?.serviceInstanceId!,
            payerId: state.selectedPayer?.id!,
            date: state.selectedTimeSlot?.start!,
            insurance: state.insuranceInfo!,
            roiContacts: state.roiContacts, // Passing the collected contacts
            patient: { 
                firstName: 'Test', 
                lastName: 'Patient', 
                email: 'test@example.com', 
                phone: '555-555-5555', 
                dateOfBirth: '1990-01-01' 
            }
        });
        setState(prev => ({ ...prev, step: 'confirmation' }));
    } catch (error) {
        setState(prev => ({ 
            ...prev, 
            bookingError: error instanceof Error ? error.message : 'Booking failed. Please try again.' 
        }));
    } finally {
        setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        {state.step === 'welcome' && <WelcomeView onSelect={handleWelcomeSelect} />}
        {state.step === 'payer-search' && <PayerSearchView onSelect={handlePayerSelect} />}
        {state.step === 'calendar' && <CalendarView onSelect={handleTimeSelect} />}
        {state.step === 'insurance-info' && <InsuranceInfoView onSubmit={handleInsuranceSubmit} />}
        {state.step === 'roi' && (
            <ROIView 
                contacts={state.roiContacts} 
                onSave={handleROIUpdate} 
                onSkip={() => setState(prev => ({ ...prev, step: 'appointment-summary' }))}
            />
        )}
        {state.step === 'appointment-summary' && <AppointmentSummaryView state={state} onConfirm={handleConfirmBooking} />}
        {state.step === 'confirmation' && <ConfirmationView />}
        
        <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
            <span>Step: {state.step}</span>
            <span>Scenario: {state.bookingScenario}</span>
        </div>
    </div>
  );
};