export type CostCategory =
  | 'Fuel'
  | 'Mechanical & Oil'
  | 'Tyre Service'
  | 'Driver Food'
  | 'Driver Daily Salary'
  | 'Driver Monthly Salary'
  | 'Terminal & Station Cost'
  | 'Others';

export interface Comment {
  id: string;
  author: 'Mr. Haile' | 'Mr. Amare' | 'Manager (Me)' | 'Owner (Uncle)';
  text: string;
  timestamp: string;
}

export interface IncomeEntry {
  id: string;
  date: string;
  route: string;
  tripType?: 'One-Way' | 'Round-Trip';
  amount: number;
  passengers?: number;
  description: string;
  comments: Comment[];
}

export interface CostEntry {
  id: string;
  date: string;
  category: CostCategory;
  amount: number;
  description: string;
  comments: Comment[];
}

export interface GlobalComment {
  id: string;
  author: 'Mr. Haile' | 'Mr. Amare' | 'Manager (Me)' | 'Owner (Uncle)';
  text: string;
  timestamp: string;
}

export interface LedgerState {
  previousNetIncome: number;
  incomes: IncomeEntry[];
  costs: CostEntry[];
  globalComments: GlobalComment[];
}
