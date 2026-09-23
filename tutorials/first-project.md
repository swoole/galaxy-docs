---
title: 首次使用
icon: guide
---

# 首次使用

本教程完成从创建组织到发布第一个应用的最短流程。

## 1. 创建组织

注册并登录后创建组织。组织是成员、项目组、集群、镜像仓库和其他资源的顶层隔离边界。

## 2. 配置镜像仓库

进入组织设置，添加目标集群能够访问的 OCI 镜像仓库。平台构建的应用镜像和
`galaxy-agent` 镜像都需要由集群节点拉取。

## 3. 接入 Docker Swarm

先在目标机器创建或确认 Swarm：

```bash
docker info --format '{{.Swarm.LocalNodeState}} {{.Swarm.ControlAvailable}}'
```

在平台的 Swarm 连接页面生成一次性 Bootstrap Token，然后在 Manager 安装 CLI 并执行
页面生成的完整命令：

```bash
sudo galaxy agent install \
  --server https://galaxy.example.com \
  --bootstrap-token <一次性令牌> \
  --image <所有 Swarm 节点可访问的 Agent 镜像>:<版本>
```

Token 有效期为 15 分钟且只能使用一次。安装完成后，`galaxy-agent` 以 Global Service
运行在每个 Swarm 节点，并主动连接管理中心。

## 4. 创建项目

1. 创建项目组并配置成员权限。
2. 创建项目，选择代码仓库来源。
3. 配置 Git 访问令牌，让平台能够读取仓库。
4. 选择或创建构建流水线。
5. 选择镜像仓库和目标镜像名称。

## 5. 构建镜像

触发一次手动构建，观察代码拉取、依赖安装、镜像构建和推送日志。构建成功后，项目中会
生成可部署的镜像制品。

## 6. 发布应用

从镜像制品创建部署实例：

1. 选择环境和刚接入的集群。
2. 填写副本数、容器端口、环境变量、配置和 Secret。
3. 如需公网访问，绑定管理员已分配的域名。
4. 提交发布并等待 Service 达到期望副本数。

发布完成后检查实例状态、容器日志和监控指标。发生问题时可从发布记录回滚到上一个镜像
制品。

## 7. 配置自动构建

在项目中复制 Webhook 地址，添加到 GitHub、GitLab、Gitea、Gitee 或 CodeUp 仓库。
选择 Push 或 Tag 事件后，代码变更即可触发对应流水线。

## 下一步

- 为项目配置部署 Secret 和持久化存储。
- 为生产域名启用 TLS。
- 配置邮件通知和项目告警。
- 使用 Web IDE 或 CLI 工作空间进行开发。
- 从应用市场安装组织需要的中间件。
