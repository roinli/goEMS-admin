import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/witos";

export function listCompany(query) {
  return request({
    url: '/ems/company/list',
    method: 'get',
    params: query
  })
}

export function getCompany(id) {
  return request({
    url: `/ems/company/${parseStrEmpty(id)}`,
    method: 'get'
  })
}

export function companyTree() {
  return request({
    url: '/ems/company/treeSelect',
    method: 'get'
  })
}

export function addCompany(data) {
  return request({
    url: '/ems/company',
    method: 'post',
    data
  })
}

export function updateCompany(data) {
  return request({
    url: '/ems/company',
    method: 'put',
    data
  })
}

export function delCompany(id) {
  return request({
    url: `/ems/company/${id}`,
    method: 'delete'
  })
}

export function exportCompany(query) {
  return request({
    url: '/ems/company/export',
    method: 'post',
    params: query
  })
}
