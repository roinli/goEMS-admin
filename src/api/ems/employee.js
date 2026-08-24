import request, { download } from '@/utils/request'
import { parseStrEmpty } from "@/utils/witos";

export function listEmployee(query) {
  return request({
    url: '/ems/employee/list',
    method: 'get',
    params: query
  })
}

export function getEmployee(id) {
  return request({
    url: `/ems/employee/${parseStrEmpty(id)}`,
    method: 'get'
  })
}

export function listEmployeeRoleOptions() {
  return request({
    url: '/ems/employee/roleOptions',
    method: 'get'
  })
}

export function addEmployee(data) {
  return request({
    url: '/ems/employee',
    method: 'post',
    data
  })
}

export function updateEmployee(data) {
  return request({
    url: '/ems/employee',
    method: 'put',
    data
  })
}

export function delEmployee(id) {
  return request({
    url: `/ems/employee/${id}`,
    method: 'delete'
  })
}

export function changeEmployeeStatus(userId, status) {
  return request({
    url: '/ems/employee/changeStatus',
    method: 'put',
    data: {
      userId,
      status
    }
  })
}

export function deptTreeSelect(companyId) {
  return request({
    url: '/ems/employee/deptTree',
    method: 'get',
    params: { companyId }
  })
}

export function exportEmployee(query) {
  return download('/ems/employee/export', query, 'ems_employee.xlsx')
}
