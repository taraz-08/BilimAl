import client from './client'

export const studentsAPI = {
  getMe: () => client.get('/students/me'),
  getGrades: () => client.get('/students/grades'),
  getRanking: () => client.get('/students/ranking'),
  getRecommendations: () => client.get('/students/recommendations'),
  getPrediction: () => client.get('/students/prediction'),
  getJournal: () => client.get('/students/journal'),
  uploadTranscript: (formData) => client.post('/students/transcript', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getTeacherRanking: (groupId) => client.get('/students/teacher/ranking', {
    params: groupId ? { group_id: groupId } : {},
  }),
}

export const groupsAPI = {
  list: () => client.get('/groups'),
  create: (payload) => client.post('/groups', payload),
}
