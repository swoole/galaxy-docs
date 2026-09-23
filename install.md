---
title: 安装 CodeGalaxy
icon: download
---

# 安装 CodeGalaxy

CodeGalaxy 当前已经开放 API、前端和 CLI/Agent 源码。统一的一键发行安装器仍在开发中，
本页先说明当前可执行的源码安装方式。正式安装器发布后，本页会增加 Docker Compose 快速
安装流程。

## 部署结构

管理中心需要以下组件：

| 组件 | 要求 |
| --- | --- |
| galaxy-api | PHP 8.4、Swoole 6.0，默认监听 9501 |
| galaxy-fe | Node.js 20 构建，Nginx 托管静态文件 |
| MySQL | 8.0 |
| Redis | 稳定版本 |

业务集群不需要运行管理中心。Docker Swarm 在每个节点运行 `galaxy-agent`；Kubernetes
由 API 使用加密 kubeconfig 连接。

## 1. 准备数据库

```bash
git clone https://github.com/swoole/galaxy-api.git
cd galaxy-api

mysql -uroot -p -h127.0.0.1 \
  -e "CREATE DATABASE code_galaxy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -uroot -p -h127.0.0.1 code_galaxy < database/init.sql
```

`database/init.sql` 只用于空库，不能用于覆盖或升级已有数据库。

## 2. 配置并启动 API

```bash
composer install
cp .env.example .env
```

至少编辑这些配置：

```dotenv
APP_ENV=prod
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=code_galaxy
DB_USERNAME=galaxy
DB_PASSWORD=请替换

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_AUTH=(null)

APP_BASE_URL=https://galaxy.example.com/api
WEBHOOK_BASE_URL=https://galaxy.example.com/api
AGENT_SERVER_URL=https://galaxy.example.com
SWARM_CREDENTIAL_KEY=请使用随机值
```

生成密钥：

```bash
openssl rand -base64 32
```

启动并检查 API：

```bash
composer start
curl -fsS http://127.0.0.1:9501/healthz
```

生产环境应使用 systemd、容器运行时或其他进程管理器确保 API 自动重启。

## 3. 构建前端

```bash
git clone https://github.com/swoole/galaxy-fe.git
cd galaxy-fe
npm install
npm run build
```

将 `dist/` 交给 Nginx，并把 `/api/` 代理到 API：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:9501/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
}

location = /agent/connect {
    proxy_pass http://127.0.0.1:9501;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
}
```

Agent 使用固定的 `/agent/connect` WebSocket 路径，因此 `AGENT_SERVER_URL` 和
`galaxy agent install --server` 应填写站点根地址，不能附加 `/api`。WebSocket 代理必须
保留 `Upgrade` 和 `Connection` 请求头。

## 4. 验证

```bash
curl -fsS https://galaxy.example.com/api/healthz
```

浏览器打开 `https://galaxy.example.com`，完成账号注册和组织创建。随后按
[首次使用](./tutorials/first-project.md) 接入集群并发布第一个项目。

## 生产检查

- 管理入口启用 HTTPS。
- MySQL 与 Redis 不直接暴露到公网。
- `.env` 仅部署用户可读，且已备份所有随机密钥。
- `APP_BASE_URL`、`WEBHOOK_BASE_URL` 和 `AGENT_SERVER_URL` 使用其他机器可访问的地址。
- SMTP 已配置，否则邮箱验证码注册不可用。
- API、数据库和 Redis 均配置自动重启与备份。
