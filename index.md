---
index: true
permalink: /
icon: link
---

# CodeGalaxy

CodeGalaxy 是部署在用户自有环境中的开源研发管理平台，用一个控制面连接代码仓库、构建
系统、镜像仓库以及 Docker Swarm 或 Kubernetes 集群。团队可以在平台中完成开发环境、
持续集成、版本发布、运行状态查看和日常运维。

CodeGalaxy 管理用户已有的服务器、集群和云资源，不销售云主机，也不提供托管集群和支付
计费服务。

## 适合谁使用

- 希望自托管研发平台，并掌握代码、凭证和运行数据的团队。
- 使用 Docker Swarm，需要可视化管理、发布、网关、监控和容器终端的团队。
- 同时维护 Swarm 与 Kubernetes，希望统一项目和发布流程的团队。
- 希望把 Git、镜像构建、发布、回滚和告警放在一个系统中的开发运维团队。

## 系统组成

```text
浏览器
  |
  v
galaxy-fe (Vue + Nginx)
  |
  v
galaxy-api (Hyperf + Swoole) ---- MySQL / Redis
  |                     |
  |                     +---- Git / Registry / Object Storage
  |
  +---- galaxy-agent -------- Docker Swarm
  |
  +---- encrypted kubeconfig - Kubernetes API
```

| 组件 | 职责 |
| --- | --- |
| `galaxy-fe` | 浏览器管理界面 |
| `galaxy-api` | 账号、权限、项目、构建、发布、审计和集群编排 |
| `galaxy-cli` | 安装 Agent、项目同步和本机 Docker 辅助命令 |
| `galaxy-agent` | 主动连接 API，执行经过授权的 Swarm 和节点操作 |
| MySQL | 保存平台业务数据 |
| Redis | 缓存、队列和 Agent 在线租约 |

## 主要功能

### 组织与权限

组织是最高层资源边界。组织内可以管理成员、项目组、角色以及集群、仓库等资源授权，让
不同团队共享基础设施，同时保持项目权限隔离。

### 项目与代码仓库

项目关联 GitHub、GitLab、Gitea、Gitee 或 CodeUp 仓库。平台保存受控的访问凭据，通过
Webhook 接收 Push 或 Tag 事件，并触发后续构建和发布流程。

### 流水线与镜像构建

项目流水线完成代码拉取、依赖安装、测试、Docker 镜像构建和推送。BuildKit 执行器可以
运行在 Swarm 或 Kubernetes 上，构建结果以镜像制品的形式进入发布流程。

### 发布与回滚

一个镜像制品可以发布到不同环境和集群。平台管理副本数、配置、Secret、端口、存储、
域名和发布记录，并允许从历史记录回滚应用版本。

### Docker Swarm 管理

Galaxy Agent 以 Global Service 运行在每个 Swarm 节点，不对外监听端口。Agent 主动建立
WebSocket 连接，平台据此管理 Node、Service、Task、Container、网络、存储、日志和终端。
Manager 在线但部分 Worker 离线时，集群显示为降级状态。

### Kubernetes 管理

平台使用加密保存的 kubeconfig 连接 Kubernetes API，可以查看核心工作负载，并通过
BuildKit Job 构建镜像、通过 Deployment 发布项目。不同编排器共用项目、制品和发布概念。

### 网关、域名与 TLS

Swarm 使用 Traefik 提供 Service 路由、域名绑定和 TLS 证书闭环。Kubernetes 使用标准
Ingress。DNS 和外部负载均衡由用户自己的基础设施管理。

### 日志、终端、监控与告警

用户可以查看容器日志和资源状态，并在授权后打开容器终端。平台采集 Service 与应用指标，
根据告警规则发送站内信、邮件或其他通知。

### Web IDE 与开发工作空间

项目可以创建带持久化工作目录的浏览器开发环境。基础镜像包含 Git、Node.js、Python、
常用构建工具和 AI 编程 CLI，项目也可以选择自定义工作空间镜像。

### 应用市场

应用市场把常用中间件和服务包装成可配置模板，并部署到组织自己的 Swarm 或 Kubernetes
集群。用户仍然负责目标集群容量、存储和外部网络。

## 编排器能力边界

| 能力 | Docker Swarm | Kubernetes |
| --- | --- | --- |
| 集群与工作负载概览 | 完整 | 核心资源 |
| 项目构建与发布 | 支持 | 支持 |
| 域名入口 | Traefik | Ingress |
| 容器日志与终端 | 支持 | 持续完善 |
| 应用市场 | 支持 | 支持 Helm 模板 |
| 接入方式 | 每节点 Agent | API 直连 kubeconfig |

## 开始使用

1. [安装 CodeGalaxy](./install.md)
2. [首次接入集群并发布项目](./tutorials/first-project.md)
3. [了解更新与备份](./upgrade.md)

源码仓库：

- [galaxy-api](https://github.com/swoole/galaxy-api)
- [galaxy-fe](https://github.com/swoole/galaxy-fe)
- [galaxy-cli](https://github.com/swoole/galaxy-cli)
