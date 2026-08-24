import request from '@/utils/request'
import { parseStrEmpty } from '@/utils/witos'
import { download } from '@/utils/request'

export function getCurrentAlarms(query) {
  return request({
    url: '/ems/alarm/current',
    method: 'get',
    params: query
  })
}

export function getAlarmHistory(query) {
  return request({
    url: '/ems/alarm/history',
    method: 'get',
    params: query
  })
}

export function listAlarmRules(query) {
  return request({
    url: '/ems/alarm/rules',
    method: 'get',
    params: query
  })
}

export function ackAlarmEvent(id) {
  return request({
    url: `/ems/alarm/events/${id}/ack`,
    method: 'post'
  })
}

export function clearAlarmEvent(id) {
  return request({
    url: `/ems/alarm/events/${id}/clear`,
    method: 'post'
  })
}

export function getAlarmRule(id) {
  return request({
    url: `/ems/alarm/rules/${parseStrEmpty(id)}`,
    method: 'get'
  })
}

export function addAlarmRule(data) {
  return request({
    url: '/ems/alarm/rules',
    method: 'post',
    data
  })
}

export function updateAlarmRule(data) {
  const id = parseStrEmpty(data.id || data.ruleId)
  return request({
    url: `/ems/alarm/rules/${id}`,
    method: 'put',
    data
  })
}

export function delAlarmRule(id) {
  return request({
    url: `/ems/alarm/rules/${id}`,
    method: 'delete'
  })
}

export function exportAlarmHistory(query) {
  return download('/ems/alarm/history/export', query, 'ems_alarm_history.xlsx')
}

export function listAlarmMailConfigs(query) {
  return request({
    url: '/ems/alarm/mail-configs',
    method: 'get',
    params: query
  })
}

export function getAlarmMailConfig(id) {
  return request({
    url: `/ems/alarm/mail-configs/${parseStrEmpty(id)}`,
    method: 'get'
  })
}

export function addAlarmMailConfig(data) {
  return request({
    url: '/ems/alarm/mail-configs',
    method: 'post',
    data
  })
}

export function updateAlarmMailConfig(data) {
  return request({
    url: `/ems/alarm/mail-configs/${parseStrEmpty(data.id)}`,
    method: 'put',
    data
  })
}

export function delAlarmMailConfig(id) {
  return request({
    url: `/ems/alarm/mail-configs/${id}`,
    method: 'delete'
  })
}

export function listAlarmNotifyLogs(query) {
  return request({
    url: '/ems/alarm/notify-logs',
    method: 'get',
    params: query
  })
}

export function exportAlarmNotifyLogs(query) {
  return download('/ems/alarm/notify-logs/export', query, 'ems_alarm_notify_logs.xlsx')
}
