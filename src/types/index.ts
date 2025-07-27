/**
 * 应用程序的类型定义文件
 * 定义了用户、茶记录等核心数据结构
 */

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface TeaRecord {
  id: string;
  userId: string;
  date: string;
  teaName: string;
  teaType: string;
  origin: string;
  brewingMethod: string;
  temperature: number;
  brewingTime: string;
  rating: number;
  appearance: string;
  aroma: string;
  taste: string;
  aftertaste: string;
  notes: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export interface TeaRecordState {
  records: TeaRecord[];
  loading: boolean;
  addRecord: (record: Omit<TeaRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecord: (id: string, record: Partial<TeaRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  getRecordsByUser: (userId: string) => TeaRecord[];
  loadRecords: () => void;
}
