export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Person {
  id: string;
  name: string;
  initial_usd: number;
  initial_iqd: number;
  owner_user_id: string;
  created_at: string;
  balance_usd: number;
  balance_iqd: number;
}

export interface Transaction {
  id: string;
  person_id: string;
  type: 'deposit' | 'withdraw';
  currency: 'USD' | 'IQD';
  amount: number;
  note: string;
  created_at: string;
  created_by: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string;
  actor_username: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

export interface MonthlyReport {
  month: string;
  deposits_usd: number;
  withdraws_usd: number;
  deposits_iqd: number;
  withdraws_iqd: number;
  total_transactions: number;
}
