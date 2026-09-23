# CodeGalaxy 平台搭建与使用教程

本教程面向第一次部署 CodeGalaxy 的运维/开发人员，从零介绍如何把平台跑起来，以及如何接
入集群、建项目、构建、部署和日常使用。

只想快速体验时，请先使用 [Docker 快速起步](./quick-start.md)。本教程保留完整的源码搭建
和组件配置说明。

> 阅读顺序建议：先看完「一、平台概览」建立整体认知，再按「三、四、五」完成部署，最后
> 按「六、七」接入集群并投入使用。

---

## 一、平台概览

CodeGalaxy 是部署在**用户自有环境**中的研发管理平台，覆盖开发、构建、发布与容器编排
管理。它不代售云资源、不提供托管集群、也不包含支付与计费能力。

平台**同时支持两种容器编排**，两者是相互独立的资源模块，接入方式完全不同：

| 编排器 | 交付程度 | 接入方式 |
| --- | --- | --- |
| Docker Swarm | 完整交付 | 每个节点部署 Galaxy Agent（Global Service），主动连接 API |
| Kubernetes | 最小闭环 | 用加密 kubeconfig 直连可达的 K8s API |

### 组件构成

```text
浏览器 ──► galaxy-fe（Vue 前端，Nginx 托管）
              │  /api 反向代理
              ▼
          galaxy-api（Hyperf / PHP + Swoole，:9501）
              │                    │
              │                    └── 子服务：ssh-relay(:9522)、helm-service(:9530，仅回环)
              ▼
   ┌──────────┴───────────┐
   │                      │
Docker Swarm 集群      Kubernetes 集群
（galaxy-agent 每节点）  （kubeconfig 直连）
```

- **galaxy-fe**：浏览器前端，只调用管理中心 API。
- **galaxy-api**：管理中心后端，负责鉴权、审计、集群绑定、构建与发布编排。
- **galaxy-cli / galaxy-agent**：Docker Swarm 的接入与管理通道。CLI 用于一次性安装，
  Agent 以 Global Service 常驻在每个 Swarm 节点。
- **外部依赖**：MySQL 8.0、Redis。

---

## 二、环境准备

### 2.1 依赖版本

| 组件 | 要求 |
| --- | --- |
| PHP | >= 8.4 |
| Swoole 扩展 | >= 6.0，并**关闭 Short Name** |
| PHP 扩展 | `openssl`、`json`、`pdo`、`pdo_mysql`、`redis` |
| MySQL | 8.0 |
| Redis | 任意稳定版本 |
| Node.js | >= 20（前端） |
| Docker | 用于构建镜像与接入 Swarm |

### 2.2 端口规划

| 端口 | 用途 | 是否对外 |
| --- | --- | --- |
| 9501 | galaxy-api 主服务（HTTP API + Agent WebSocket） | 需对集群节点可达 |
| 9522 | ssh-relay（原生 SSH 容器终端） | 按需 |
| 9530 | helm-service（Kubernetes 应用市场用） | 仅回环 |
| 80 / 443 | galaxy-fe Nginx 与集群网关入口 | 对外 |

---

## 三、搭建后端 galaxy-api

### 3.1 拉取代码并安装依赖

```bash
git clone https://github.com/swoole/galaxy-api.git
cd galaxy-api
composer install
cp .env.example .env
```

### 3.2 初始化数据库

`database/init.sql` 是新库的**完整 Schema**（只有表结构，不含任何数据、账号或历史迁移
状态），仅用于空库初始化。

```bash
mysql -uroot -p -h127.0.0.1 \
  -e "CREATE DATABASE code_galaxy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -uroot -p -h127.0.0.1 code_galaxy < database/init.sql
```

> 库名要与 `.env` 中的 `DB_DATABASE` 保持一致（示例为 `code_galaxy`）。
> `database/init.sql` **不能升级已有安装**，运行中的实例改表结构需另行评估。

### 3.3 配置 `.env`

至少需要配置数据库与 Redis：

```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=code_galaxy
DB_USERNAME=root
DB_PASSWORD=

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_AUTH=(null)
REDIS_DB=0
```

生产环境必须生成并固定以下密钥（缺失会导致集群凭证、登录态异常）：

```bash
openssl rand -base64 32   # SWARM_CREDENTIAL_KEY，所有 API 实例须保持一致
openssl rand -base64 32   # ENCRYPT_KEY，所有 API 实例须保持一致
```

同时填写对外地址，容器部署时**不要填 `localhost`**：

```ini
APP_BASE_URL=http://<你的域名或 IP>:9501
WEBHOOK_BASE_URL=http://<Git 仓库服务可访问的 API 地址>:9501
AGENT_SERVER_URL=<集群节点可访问的 API 地址>
```

其余可选配置（按需开启）：

- 邮件：`SMTP_*`（注册/通知邮件，**注册流程依赖邮件验证码**）。
- 短信：`SMS_GATEWAYS`、`QCLOUD_*` / `SMS_ALI_*`（短信登录与短信通知）。
- 对象存储：`COS_*`。
- 原生 SSH 容器终端：`SSH_RELAY_ENABLED=true` 且设置高强度 `SSH_RELAY_INTERNAL_TOKEN`。
- Kubernetes 应用市场 Helm 子服务：`HELM_SERVICE_ENABLED=true`（默认开启）。

### 3.4 启动服务

```bash
composer start          # 等价于 php bin/hyperf.php start，默认监听 9501
```

用 Docker 运行（镜像入口脚本会按环境变量自动拉起 ssh-relay / helm-service）：

```bash
docker build -t your-registry/galaxy-api:latest .
docker run -d --name galaxy-api --env-file .env \
  -p 9501:9501 -p 9522:9522 \
  your-registry/galaxy-api:latest
```

启动后用健康检查接口确认：

```bash
curl -s http://127.0.0.1:9501/healthz
```

---

## 四、搭建前端 galaxy-fe

### 4.1 构建

```bash
cd galaxy-fe
npm install
npm run build            # 产物在 dist/
```

或用 Docker 构建（镜像内为 Nginx，产物位于 `/usr/share/nginx/html`）：

```bash
docker build \
  --build-arg baseapi=/api/ \
  --build-arg VUE_APP_TRUSTED_DOMAINS=example.com,*.example.com \
  --build-arg VUE_APP_COOKIE_DOMAIN=.example.com \
  -t your-registry/galaxy-fe:latest .
docker run -d --name galaxy-fe -p 8081:80 --restart=always your-registry/galaxy-fe:latest
```

构建参数说明：

| 参数 | 对应环境变量 | 默认 | 说明 |
| --- | --- | --- | --- |
| `baseapi` | `VUE_APP_BASE_API` | `/api/` | 后端 API 基础地址 |
| `staticprefix` | `VUE_APP_STATIC_PREFIX` | `/` | 静态资源路径，部署到子路径时修改 |
| `VUE_APP_TRUSTED_DOMAINS` | 同名 | 空 | 登录后可跳转的外域白名单，逗号分隔，支持 `*.example.com` |
| `VUE_APP_COOKIE_DOMAIN` | 同名 | 空 | 跨域 Cookie 写入域名，如 `.example.com` |

`VUE_APP_TRUSTED_DOMAINS` 与 `VUE_APP_COOKIE_DOMAIN` 默认为空。只有需要跨子域跳转或共享
Cookie 时才设置，并限制为自己控制的域名。

### 4.2 配置反向代理（关键步骤）

前端默认以 `/api/` 作为后端前缀，需要在 Nginx 把 `/api/` 代理到 galaxy-api，并透传
WebSocket：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:9501/;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade           $http_upgrade;
    proxy_set_header Connection        "upgrade";
    proxy_read_timeout 3600s;
}

location = /agent/connect {
    proxy_pass http://127.0.0.1:9501;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade           $http_upgrade;
    proxy_set_header Connection        "upgrade";
    proxy_read_timeout 3600s;
}
```

> `proxy_pass` 末尾是否带 `/` 决定是否剥离 `/api` 前缀。请以 galaxy-api 实际路由前缀为准
> 调整：后端路由不带 `/api` 时保留末尾 `/`，带 `/api` 时去掉末尾 `/`。

Agent 使用固定的 `/agent/connect` 路径。`AGENT_SERVER_URL` 和
`galaxy agent install --server` 应填写站点根地址，不能附加 `/api`。

访问 `http://<前端地址>` 即可打开登录页。

---

## 五、初始化平台

### 5.1 注册第一个账号

首次安装可以设置 `GALAXY_INSTALL_TOKEN`，然后打开一次性安装页创建管理员，无需配置邮件：

```text
https://galaxy.example.com/api/install#token=<GALAXY_INSTALL_TOKEN>
```

创建成功后安装页不可再次进入。后续开放普通用户自助注册时，邮箱注册采用**邮箱 + 邮件
验证码**，需要先配置可用的 `SMTP_*`。

注册需要：邮箱、邮件验证码、密码（6–20 位）、确认密码、昵称。

登录支持两种方式：

- **账号密码登录**：邮箱 + 密码 + 图形验证码。
- **短信验证码登录**：手机号 + 短信验证码（需配置短信网关）。

### 5.2 创建组织

平台以**组织**为顶层边界，登录后先创建组织，再在组织内建项目组、项目和成员。

### 5.3 指定管理员

`.env` 中通过以下两项指定系统管理员组织/账号：

```ini
ADMIN_ORG=<管理员组织的 ID>
ADMIN_EMAILS=<管理员邮箱，逗号分隔>
```

管理员组织可以修改系统级配置（如 IDE、构建集群等）。

---

## 六、接入集群

### 6.1 Docker Swarm（完整能力）

Swarm 的唯一管理通道是部署在每个节点上的 Galaxy Agent，**不存在无 Agent 的直连模式**。

**前置条件**：目标主机已执行 `docker swarm init`（或已加入现有 Swarm）。

**步骤 1：在 Web 生成 Bootstrap Token**

进入「集群 → Swarm → 连接设置」，生成 Bootstrap Token。该 Token：

- 有效期 **15 分钟**，只能使用一次；
- 明文只展示一次；
- 用于首次 Manager 绑定，绑定成功后立即失效。

**步骤 2：在 Manager 安装 CLI**

Linux / macOS：

```bash
curl -s https://s.code-galaxy.net/cli-install.sh | bash -
galaxy version
```

Windows：下载 `cli-install.bat` 后运行，或使用官方下载接口获取 `galaxy.exe`。

> 自建/内网环境无法访问官方下载地址时，可直接用源码构建：`cd galaxy-cli && make build`
> 生成 `galaxy` 可执行文件后分发；也可以修改 `scripts/cli-install.sh` 中的 `API_URL`
> 指向自己的管理中心。

**步骤 3：执行一次性安装**

复制 Web 生成的完整命令，在 **Swarm Manager** 上执行：

```bash
sudo galaxy agent install \
  --server https://galaxy.example.com \
  --bootstrap-token <一次性 Token>
```

支持的可选参数：

| 参数 | 说明 |
| --- | --- |
| `--image` | Agent 镜像地址，默认取构建时注入或环境变量 `GALAXY_AGENT_IMAGE` |
| `--bootstrap-token-file` | 从权限受控文件读取 Token，避免出现在命令历史 |
| `--docker-socket` | Manager 本机 Docker Socket，默认 `/var/run/docker.sock` |

安装器会依次完成 4 步并退出：

```text
1/4 检查本机 Docker Swarm Manager
2/4 使用 Bootstrap Token 注册 Swarm
3/4 创建机器凭证、加密控制网络和 Docker Secret
4/4 Global Agent Service 已部署到所有 Linux 节点
```

之后常驻运行的是 `galaxy-agent` Global Service，而不是 CLI 进程。

**步骤 4：验证集群状态**

集群状态含义：

| 状态 | 含义 |
| --- | --- |
| `pending` | 等待首次 Manager bootstrap |
| `initializing` | 已绑定 Swarm，正在部署/发现节点 Agent |
| `healthy` | Manager 与所有 Ready 节点 Agent 在线 |
| `degraded` | Manager 可用，但部分 Worker Agent 离线 |
| `offline` | 没有可用 Manager Agent |

**调整 API 地址或镜像**（例如管理中心地址填错导致 Agent 离线）：

```bash
sudo galaxy agent set --server https://galaxy.example.com
sudo galaxy agent set --image your-registry/galaxy-agent:1.0.3
```

`--server` 与 `--image` 可在一次调用中同时设置。CLI 会拒绝回环地址，也只操作由 Galaxy
Label 管理的 Service。

**Agent 镜像要求**：Worker 会独立拉取镜像，因此镜像必须推送到所有节点均可访问的仓库
（公共或私有），并建议使用固定的版本标签。

### 6.2 Kubernetes（最小闭环）

对 Galaxy API **网络可达**的 Kubernetes 集群，使用**加密 kubeconfig 直连** Kubernetes API。

接入方式：在「集群 → Kubernetes → 创建」，粘贴 kubeconfig。连接凭据规范化后加密保存。

当前开放的能力边界：

| 能力 | 状态 |
| --- | --- |
| 概览、Node、Namespace、Pod、Deployment、Service | 已开放 |
| 项目镜像构建（BuildKit Job）、Deployment 发布 | 已开放 |
| 标准 HTTP Ingress（强制绑定已授权托管域名） | 已开放 |
| 日志、容器终端、Ingress 高级流量治理、Gateway API、TLS Secret | **暂未开放** |
| 私网/NAT 后的集群 Connector | **暂未实现** |

> 教程以当前代码和能力边界为准。仓库 `docs/` 下的部分历史手册仍带有 Kubernetes/TKE/ACK
> 时代的描述，与当前实现存在出入，请以本文档和平台实际界面为准。

---

## 七、日常使用

### 7.1 组织与成员

- 在「组织设置 → 成员管理 → 邀请成员」中邀请：已注册用户按昵称/用户名/手机号/邮箱
  精确搜索并分配角色；未注册用户可复制邀请链接，注册后自动入组织。
- 成员可在右上角切换所属组织。

### 7.2 项目组与项目

- **项目组**是组织内的成员、角色与资源授权边界。
- **项目**承载代码仓库、构建 Pipeline、镜像制品、配置、发布、运行实例、路由与业务监控。
- 同一项目可构建多个镜像制品，一个制品可被多个部署实例引用。

### 7.3 Git 授权与 Webhook

- **Git 授权（gitauth）**：为平台授予读取代码的权限。GitHub 用 Personal Access Token；
  GitLab/Gitea 用 Access Token（自建域名须为 **https**）；Gitee 用私人令牌；CodeUp 用
  阿里云 AK/SK + 个人令牌。
- **Webhook（githook）**：把平台提供的 Webhook 地址填入仓库，用于 Push/Tag 触发自动构建。

### 7.4 流水线

- 平台提供开箱即用的**默认流水线**（不可修改，可「另存为」后再编辑）。
- 代码缓存：编辑流水线 →「Git 代码克隆」任务 → 将拉取模式设为 `pull`，第二次拉取只取
  差量，可显著加速构建。

### 7.5 构建与镜像制品

- 构建由平台分派的 BuildKit 执行器完成：Swarm 集群与 Kubernetes 集群使用各自的执行器，
  但对项目、Pipeline、Artifact 的领域模型保持一致。
- 切换目标集群不会改变构建与发布的上层模型。

### 7.6 部署实例

- 在项目中选择镜像制品 → 选择环境、集群、配置/Secret、副本数与域名 → 创建部署实例。
- 发布、重启、回滚、状态刷新统一经运行时驱动完成：
  - Swarm：映射为 Service + Task/Container；
  - Kubernetes：映射为 Deployment + Pod。

### 7.7 域名与 TLS

- Swarm 集群由内置 **Traefik** 提供 Service 路由、域名绑定与 TLS 证书闭环。
- Kubernetes 使用标准 Ingress，Host 必须来自管理员已分配给该项目组的托管域名。
- DNS 解析与四层 SLB 由用户或云基础设施负责，不属于平台范围。

### 7.8 终端与日志

- Swarm 节点上的容器支持 Web Exec 终端、日志、`inspect`、`stats` 和文件上传/下载，均按
  Task 所在 NodeID 路由到对应节点的 Agent。
- 可选开启原生 SSH 容器终端（`SSH_RELAY_ENABLED`）。

### 7.9 开发环境（CloudIDE / CLI 工作空间）

浏览器内的云端开发环境，无需本地搭环境即可编写、调试并提交代码；成果以推送到项目 Git
仓库的 Commit 为交付边界。

### 7.10 应用市场与监控

- **应用市场**：一键部署 Gitea、Registry、MySQL、Redis 等常见应用与中间件。
- **监控**：内置 Prometheus 采集集群、Service 与应用指标。

---

## 八、CLI 安装速查

| 平台 | 命令 |
| --- | --- |
| Linux | `curl -s https://s.code-galaxy.net/cli-install.sh \| bash -` |
| macOS | 同上；命令补全需 Bash 4.1+ 与 `brew install bash-completion@2` |
| Windows | 运行 `cli-install.bat`，或下载 `galaxy.exe` |

安装后验证：

```bash
galaxy version
```

命令补全：

```bash
galaxy completion bash      # 或 zsh / fish
```

---

## 九、常见问题

**注册收不到验证码**
检查 `.env` 中 `SMTP_*` 是否可用，以及发件服务器是否拦截。

**前端能打开但接口全部失败**
检查 Nginx 是否把 `/api/` 正确代理到 `9501`，且 `proxy_pass` 末尾斜杠与后端路由前缀匹配；
确认 `.env` 的 `APP_BASE_URL`、`WEBHOOK_BASE_URL` 不是 `localhost`。

**集群一直是 `pending`**
Bootstrap Token 已过期或未执行安装。重新生成 Token 并执行 `galaxy agent install`。

**集群 `degraded` / `offline`**
部分或全部节点 Agent 离线。常见原因是 Agent 配置的 API 地址不可达，用
`galaxy agent set --server <可访问地址>` 修复后观察滚动恢复。

**镜像拉取失败（Worker 拉不到 Agent 镜像）**
Agent 镜像必须推送到所有 Swarm 节点均可访问的仓库。私有仓库需预先配置拉取凭证，或由
平台按组织匹配 Registry 凭证下发。

**容器起不来想排查**
可临时把入口命令改为 `tail -f /dev/null` 进入容器排查。

**需要获取客户端真实 IP**
读取 `X-Real-IP` / `X-Forwarded-For`；平台还会附带 `X-Request-ID`、
`X-Forwarded-Host/Port/Proto` 等头。

---

## 十、参考

- [系统功能介绍](./index.md)
- [安装 CodeGalaxy](./install.md)
- [更新与备份](./upgrade.md)
- [后端源码](https://github.com/swoole/galaxy-api)
- [前端源码](https://github.com/swoole/galaxy-fe)
- [CLI 与 Agent 源码](https://github.com/swoole/galaxy-cli)
