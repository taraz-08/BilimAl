import client from './client'

export const testsAPI = {
  list: () => client.get('/tests'),
  get: (id) => client.get(`/tests/${id}`),
  create: (payload) => client.post('/tests', payload),
  delete: (id) => client.delete(`/tests/${id}`),
  addQuestion: (testId, q) => client.post(`/tests/${testId}/questions`, q),
  publish: (id) => client.post(`/tests/${id}/publish`),
  generateFromTopic: (payload) => client.post('/tests/generate', payload),
  generateFromFile: (formData) => client.post('/tests/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  assign: (payload) => client.post('/tests/assign', payload),
  getAssignments: (testId) => client.get(`/tests/${testId}/assignments`),
  getStudentTests: () => client.get('/tests/student/available'),
}

export const submissionsAPI = {
  submit: (payload) => client.post('/submissions', payload),
  list: () => client.get('/submissions'),
  getDetail: (id) => client.get(`/submissions/${id}`),
}

export const gradesAPI = {
  approveOrReject: (payload) => client.post('/grades/approve', payload),
}

export const proctorAPI = {
  reportViolation: (payload) => client.post('/proctoring/violation', payload),
  getViolations: () => client.get('/proctoring/violations'),
}
