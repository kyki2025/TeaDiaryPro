/**
 * 茶记录状态管理store
 * 处理茶记录的增删改查操作和数据持久化，支持云端同步
 */

import { create } from 'zustand';
import { TeaRecordState, TeaRecord } from '../types';
import simpleCloudStorage from '../services/simpleCloudStorage';

const useTeaRecordStore = create<TeaRecordState>((set, get) => ({
  records: [],
  loading: false,

  loadRecords: () => {
    try {
      const records: TeaRecord[] = JSON.parse(localStorage.getItem('tea-app-records') || '[]');
      set({ records });
    } catch (error) {
      console.error('Load records error:', error);
      set({ records: [] });
    }
  },

  addRecord: async (recordData) => {
    const { records } = get();
    const newRecord: TeaRecord = {
      ...recordData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedRecords = [...records, newRecord];
    set({ records: updatedRecords });
    localStorage.setItem('tea-app-records', JSON.stringify(updatedRecords));

    // 同步到云端
    try {
      const users = JSON.parse(localStorage.getItem('tea-app-users') || '[]');
      const currentUser = users.find((u: any) => u.id === recordData.userId);
      if (currentUser) {
        await simpleCloudStorage.uploadData(currentUser.email, users, updatedRecords);
        console.log('茶记录已同步到云端');
      }
    } catch (error) {
      console.error('云端同步失败:', error);
    }
  },

  updateRecord: async (id, updateData) => {
    const { records } = get();
    const updatedRecords = records.map(record =>
      record.id === id
        ? { ...record, ...updateData, updatedAt: new Date().toISOString() }
        : record
    );
    
    set({ records: updatedRecords });
    localStorage.setItem('tea-app-records', JSON.stringify(updatedRecords));

    // 同步到云端
    try {
      const users = JSON.parse(localStorage.getItem('tea-app-users') || '[]');
      const recordToUpdate = updatedRecords.find(r => r.id === id);
      if (recordToUpdate) {
        const currentUser = users.find((u: any) => u.id === recordToUpdate.userId);
        if (currentUser) {
          await simpleCloudStorage.uploadData(currentUser.email, users, updatedRecords);
          console.log('茶记录更新已同步到云端');
        }
      }
    } catch (error) {
      console.error('云端同步失败:', error);
    }
  },

  deleteRecord: async (id) => {
    const { records } = get();
    const recordToDelete = records.find(r => r.id === id);
    const updatedRecords = records.filter(record => record.id !== id);
    
    set({ records: updatedRecords });
    localStorage.setItem('tea-app-records', JSON.stringify(updatedRecords));

    // 同步到云端
    try {
      if (recordToDelete) {
        const users = JSON.parse(localStorage.getItem('tea-app-users') || '[]');
        const currentUser = users.find((u: any) => u.id === recordToDelete.userId);
        if (currentUser) {
          await simpleCloudStorage.uploadData(currentUser.email, users, updatedRecords);
          console.log('茶记录删除已同步到云端');
        }
      }
    } catch (error) {
      console.error('云端同步失败:', error);
    }
  },

  getRecordsByUser: (userId) => {
    const { records } = get();
    return records.filter(record => record.userId === userId);
  },
}));

export default useTeaRecordStore;
