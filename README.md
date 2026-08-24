## 开源版范围

本分支仅保留以下 EMS 页面：

- 列表视图
- 监控
- 电站管理
- 告警管理
- 公司管理
- 员工管理
- 业务配置

平台管理菜单及其后端权限能力继续保留。

公司、租户、电站、员工、业务配置和告警管理保留原有后端能力。列表视图和监控页面继续读取数据库中的公司、电站数据，设备、控制器、发电量和遥测数据由前端模拟。

## 开发

```bash
# 安装依赖
npm install

# 建议不要直接使用 cnpm 安装依赖，会有各种诡异的 bug。可以通过如下操作解决 npm 下载速度慢的问题
npm install --registry=https://registry.npm.taobao.org

# 启动服务
npm run dev
```

浏览器访问 http://localhost:80

## 发布

```bash
# 构建测试环境
npm run build:stage

# 构建生产环境
npm run build:prod
```
