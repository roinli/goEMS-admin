import request from '@/utils/request'

export function getMapConfig() {
  return request({
    url: '/ems/map/config',
    method: 'get'
  })
}

export function geocoderByLocation(params) {
  return request({
    url: '/ems/map/geocoder',
    method: 'get',
    params
  })
}

export function geocoderByAddress(params) {
  return request({
    url: '/ems/map/geocoder/address',
    method: 'get',
    params
  })
}

export function getMapSuggestion(params) {
  return request({
    url: '/ems/map/suggestion',
    method: 'get',
    params
  })
}
