import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/witos";

export function listStation(query) {
  return request({
    url: '/ems/station/list',
    method: 'get',
    params: query
  })
}

export function getStation(id) {
  return request({
    url: `/ems/station/${parseStrEmpty(id)}`,
    method: 'get'
  })
}

export function addStation(data) {
  return request({
    url: '/ems/station',
    method: 'post',
    data
  })
}

export function updateStation(data) {
  return request({
    url: '/ems/station',
    method: 'put',
    data
  })
}

export function delStation(id) {
  return request({
    url: `/ems/station/${id}`,
    method: 'delete'
  })
}

export function changeStationStatus(id, status) {
  return request({
    url: '/ems/station/changeStatus',
    method: 'put',
    data: {
      id,
      status
    }
  })
}

export function exportStation(query) {
  return request({
    url: '/ems/station/export',
    method: 'post',
    params: query
  })
}
