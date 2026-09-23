---
title: 安装 CodeGalaxy
icon: download
---

# 安装 CodeGalaxy

新安装建议使用 [Docker 快速起步](./quick-start.md)。本页说明镜像部署结构和需要自行管理
基础设施时的源码安装方式。

## Docker Compose 部署

快速部署由以下镜像组成：

| 镜像 | 用途 |
| --- | --- |
| `registry.cn-shanghai.aliyuncs.com/swoole-public/galaxy:<版本>` | 前端、Nginx、API、SSH Relay 和 Helm Service |
| `mysql:8.0` | 平台业务数据库 |
| `redis:7.4-alpine` | 缓存、队列和 Agent 在线租约 |
| `phpswoole/galaxy-agent:<版本>` | 接入 Docker Swarm 时部署到每个节点 |

MySQL 和 Redis 只加入 Compose 内部网络，不映射到宿主机端口。业务数据分别保存在命名
数据卷中，重建应用容器不会删除数据。

一键部署命令和首次初始化步骤见 [Docker 快速起步](./quick-start.md)。

安装器默认使用 `latest` 稳定标签。生产环境需要固定升级窗口时，通过
`--version <版本号>` 选择指定版本，例如 `--version 1.0.0`。

## 源码安装

源码方式适合开发、二次开发，或需要使用已有 MySQL、Redis 和反向代理的环境。

### 1. 初始化数据库

```bash
git clone https://github.com/swoole/galaxy-api.git
cd galaxy-api

mysql -uroot -p -h127.0.0.1 \
  -e "CREATE DATABASE code_galaxy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -uroot -p -h127.0.0.1 code_galaxy < database/init.sql
```

`database/init.sql` 只用于空库，不能用于覆盖或升级已有数据库。

### 2. 配置并启动 API

```bash
composer install
cp .env.example .env
```

至少设置数据库、Redis、对外地址、集群凭证密钥和安装令牌：

```dotenv
APP_ENV=prod
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=code_galaxy
DB_USERNAME=galaxy
DB_PASSWORD=<数据库密码>

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

APP_BASE_URL=https://galaxy.example.com/api
WEBHOOK_BASE_URL=https://galaxy.example.com/api
AGENT_SERVER_URL=https://galaxy.example.com
SWARM_CREDENTIAL_KEY=<openssl rand -base64 32 的输出>
GALAXY_INSTALL_TOKEN=<openssl rand -hex 32 的输出>
GALAXY_ADMIN_EMAIL=admin@example.com
```

```bash
composer start
curl -fsS http://127.0.0.1:9501/healthz
```

生产环境应使用 systemd、容器运行时或其他进程管理器确保 API 自动重启。

### 3. 构建前端

```bash
git clone https://github.com/swoole/galaxy-fe.git
cd galaxy-fe
npm ci
npm run build
```

将 `dist/` 交给 Nginx，并把 `/api/` 代理到 API。Agent 使用固定的
`/agent/connect` WebSocket 路径，代理必须保留 `Upgrade` 和 `Connection` 请求头。

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

源码部署可以通过 API 路径打开一次性安装页：

```text
https://galaxy.example.com/api/install#token=<GALAXY_INSTALL_TOKEN>
```

创建首个账号后，此页面和初始化接口返回 `404`。也可以在 API 目录使用命令行创建首个
账号，密码通过标准输入传入，不会写入 shell 历史：

```bash
printf '%s\n' '<管理员密码>' \
  | php bin/hyperf.php user:create \
      --email admin@example.com \
      --nickname Administrator \
      --password-stdin
```

## 生产检查

- 管理入口启用 HTTPS。
- MySQL 与 Redis 不直接暴露到公网。
- `.env` 只允许部署用户读取，并备份其中的固定密钥。
- `APP_BASE_URL`、`WEBHOOK_BASE_URL` 和 `AGENT_SERVER_URL` 使用其他机器可访问的地址。
- API、数据库和 Redis 均配置自动重启与备份。
