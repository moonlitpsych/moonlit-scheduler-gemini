export interface Payer {
  id: string;
  name: string;
}

export interface Provider {
  id: string;
  name: string;
  image?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  providerId: string;
  serviceInstanceId: string;
}

export interface ROIContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  notifyOfAppointment: boolean;
}

export interface InsuranceInfo {
  memberId: string;
  groupNumber?: string;
  policyHolderName: string;
  policyHolderDob: string;
}

export type BookingStep = 
  | 'welcome' 
  | 'payer-search' 
  | 'calendar' 
  | 'insurance-info' 
  | 'roi' 
  | 'appointment-summary' 
  | 'confirmation';

export type BookingScenario = 'self' | 'third-party' | 'case-manager';

export interface BookingState {
    step: BookingStep;
    bookingScenario: BookingScenario;
    selectedPayer?: Payer;
    selectedTimeSlot?: TimeSlot;
    insuranceInfo?: InsuranceInfo;
    roiContacts: ROIContact[]; 
    bookingForSomeoneElse?: boolean;
    isSubmitting?: boolean;
    bookingError?: string;
}