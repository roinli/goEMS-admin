export const openSourceRoutes = [
  {
    path: '/ems-home',
    component: 'Layout',
    redirect: '/ems-home/list',
    name: 'EmsHome',
    meta: { title: '首页', icon: 'dashboard' },
    children: [
      { path: 'list', component: 'ems/home/list', name: 'EmsHomeList', meta: { title: '列表视图', icon: 'list' }}
    ]
  },
  {
    path: '/ems-monitor',
    component: 'Layout',
    redirect: '/ems-monitor/overview',
    name: 'EmsMonitor',
    meta: { title: '监控', icon: 'monitor' },
    children: [
      { path: 'overview', component: 'ems/monitor/overview', name: 'EmsMonitorOverview', meta: { title: '监控', icon: 'monitor' }}
    ]
  },
  {
    path: '/ems-station',
    component: 'Layout',
    redirect: '/ems-station/index',
    name: 'EmsStation',
    meta: { title: '电站', icon: 'tree' },
    children: [
      { path: 'index', component: 'ems/station/index', name: 'EmsStationIndex', meta: { title: '电站管理', icon: 'tree' }},
      { path: 'create', component: 'ems/station/create', name: 'EmsStationCreate', hidden: true, meta: { title: '新增电站', activeMenu: '/ems-station/index' }}
    ]
  },
  {
    path: '/ems-device', component: 'Layout', redirect: '/ems-device/index', name: 'EmsDevice',
    meta: { title: '设备管理', icon: 'server' },
    children: [{ path: 'index', component: 'ems/device/index', name: 'EmsDeviceIndex', meta: { title: '设备管理', icon: 'server' }}]
  },
  {
    path: '/ems-ops',
    component: 'Layout',
    redirect: '/ems-ops/alarm-current',
    name: 'EmsOps',
    meta: { title: '运维', icon: 'tool' },
    children: [
      { path: 'alarm-current', component: 'ems/ops/alarm-current', name: 'EmsAlarmCurrent', meta: { title: '告警管理', icon: 'bell' }},
      { path: 'alarm-history', component: 'ems/ops/alarm-current', name: 'EmsAlarmHistory', hidden: true, meta: { title: '历史告警', activeMenu: '/ems-ops/alarm-current' }},
      { path: 'alarm-setting', component: 'ems/ops/alarm-current', name: 'EmsAlarmSetting', hidden: true, meta: { title: '告警设置', activeMenu: '/ems-ops/alarm-current' }}
    ]
  },
  {
    path: '/ems-system',
    component: 'Layout',
    redirect: '/ems-system/company',
    name: 'EmsSystem',
    meta: { title: '系统', icon: 'system' },
    children: [
      { path: 'company', component: 'ems/system/company', name: 'EmsCompany', meta: { title: '公司管理', icon: 'tree' }},
      { path: 'company-edit', component: 'ems/system/company-edit', name: 'EmsCompanyEdit', hidden: true, meta: { title: '公司编辑', activeMenu: '/ems-system/company' }},
      { path: 'company-info', component: 'ems/system/company-info', name: 'EmsCompanyInfo', hidden: true, meta: { title: '公司信息', activeMenu: '/ems-system/company' }},
      { path: 'employee', component: 'ems/system/employee', name: 'EmsEmployee', meta: { title: '员工管理', icon: 'user' }},
      { path: 'employee-edit', component: 'ems/system/employee-edit', name: 'EmsEmployeeEdit', hidden: true, meta: { title: '员工编辑', activeMenu: '/ems-system/employee' }},
      { path: 'employee-password', component: 'ems/system/employee-password', name: 'EmsEmployeePassword', hidden: true, meta: { title: '重置员工密码', activeMenu: '/ems-system/employee' }},
      { path: 'business-config', component: 'ems/system/business-config', name: 'EmsBusinessConfig', meta: { title: '业务配置', icon: 'edit' }},
      { path: 'business-config-edit', component: 'ems/system/business-config-edit', name: 'EmsBusinessConfigEdit', hidden: true, meta: { title: '业务配置编辑', activeMenu: '/ems-system/business-config' }}
    ]
  }
]
