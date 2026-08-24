import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/witos";

export function listBusinessConfig(query) {
  return request({
    url: '/ems/business-config/list',
    method: 'get',
    params: query
  })
}

export function listBusinessConfigTemplates() {
  return request({
    url: '/ems/business-config/templates',
    method: 'get'
  })
}

export function getBusinessCoreValues(query) {
  return request({
    url: '/ems/business-config/core-values',
    method: 'get',
    params: query
  })
}

export function saveBusinessConfig(data) {
  return request({
    url: '/ems/business-config',
    method: data && data.id ? 'put' : 'post',
    data
  })
}

export function getBusinessConfig(id) {
  return request({
    url: `/ems/business-config/${parseStrEmpty(id)}`,
    method: 'get'
  })
}

export function delBusinessConfig(id) {
  return request({
    url: `/ems/business-config/${id}`,
    method: 'delete'
  })
}
