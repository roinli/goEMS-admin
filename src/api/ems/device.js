import request from '@/utils/request'
import { mockDeviceTelemetry } from './mockTelemetry'

export function listDevice(query = {}) {
  return request({
    url: '/ems/device/list',
    method: 'get',
    params: query
  }).then(response => Object.assign({}, response, {
    data: (response.data || []).map(mockDeviceTelemetry)
  }))
}

export function getDevice(id) {
  return request({
    url: `/ems/device/${id}`,
    method: 'get'
  })
}

export function addDevice(data) {
  return request({
    url: '/ems/device',
    method: 'post',
    data
  })
}

export function updateDevice(data) {
  return request({
    url: '/ems/device',
    method: 'put',
    data
  })
}

export function delDevice(id) {
  return request({
    url: `/ems/device/${id}`,
    method: 'delete'
  })
}
