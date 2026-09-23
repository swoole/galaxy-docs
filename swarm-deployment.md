---
title: 部署到 Docker Swarm
description: 使用外部数据库、Redis 和 Docker Secret 部署可迁移的 CodeGalaxy 服务
---

# 部署到 Docker Swarm

单机快速安装中的 MySQL 和 Redis 使用节点本地 Docker Volume，不能直接用于 Swarm。Swarm
任务迁移到其他节点后，新节点上的同名 Volume 是另一份空数据。

生产 Swarm 部署只负责 Galaxy 服务本身，采用以下结构：

- Galaxy 服务不挂载本地目录，可以在节点间迁移。
- MySQL 使用云数据库、MySQL 集群或集群外的固定数据库服务。
- Redis 使用云 Redis、Redis Sentinel/Cluster 或集群外的固定 Redis 服务。
- 用户上传内容使用 COS、OSS、S3 或兼容对象存储。
- 数据库密码和平台固定密钥保存在 Docker Secret 中。
- Galaxy 暂时保持一个副本；任务迁移后 Agent 会自动重新连接。

## 1. 下载 Stack 文件

```bash
curl -fsSLO https://git.code-galaxy.net/github/galaxy-docs/raw/branch/main/downloads/stack.yaml
```

## 2. 创建 Docker Secret

以下 Secret 必须在部署前创建。先生成权限为 `0600` 的源文件并纳入安全备份，再导入
Docker Secret。将示例值替换为实际数据库、Redis 密码。Docker Secret 创建后不能通过
Docker API 读回原文。

```bash
install -d -m 0700 galaxy-secrets
printf '%s' '<MySQL 密码>' > galaxy-secrets/db-password
printf '%s' '<Redis 密码>' > galaxy-secrets/redis-password
openssl rand -base64 32 | tr -d '\n' > galaxy-secrets/simple-jwt-secret
openssl rand -base64 32 | tr -d '\n' > galaxy-secrets/sso-jwt-secret
openssl rand -base64 32 | tr -d '\n' > galaxy-secrets/encrypt-key
openssl rand -base64 32 | tr -d '\n' > galaxy-secrets/swarm-credential-key
openssl rand -base64 32 | tr -d '\n' > galaxy-secrets/ssh-relay-token
openssl rand -hex 32 > galaxy-secrets/install-token
chmod 0600 galaxy-secrets/*

docker secret create galaxy_db_password galaxy-secrets/db-password
docker secret create galaxy_redis_password galaxy-secrets/redis-password
docker secret create galaxy_simple_jwt_secret galaxy-secrets/simple-jwt-secret
docker secret create galaxy_sso_jwt_secret galaxy-secrets/sso-jwt-secret
docker secret create galaxy_encrypt_key galaxy-secrets/encrypt-key
docker secret create galaxy_swarm_credential_key galaxy-secrets/swarm-credential-key
docker secret create galaxy_ssh_relay_token galaxy-secrets/ssh-relay-token
docker secret create galaxy_install_token galaxy-secrets/install-token
```

`galaxy_encrypt_key` 和 `galaxy_swarm_credential_key` 用于解密数据库中的敏感凭据。丢失或
重新生成后，已有云账号、Registry、证书和集群凭据可能无法解密。

首次安装地址中的令牌可从备份源文件读取：

```bash
cat galaxy-secrets/install-token
```

## 3. 部署

在 Swarm Manager 设置非敏感参数并部署：

```bash
export DB_HOST=mysql.example.internal
export DB_PORT=3306
export DB_DATABASE=code_galaxy
export DB_USERNAME=galaxy
export REDIS_HOST=redis.example.internal
export REDIS_PORT=6379
export APP_BASE_URL=https://galaxy.example.com/api
export AGENT_SERVER_URL=https://galaxy.example.com
export GALAXY_ADMIN_EMAIL=admin@example.com
export GALAXY_VERSION=1.0.0

docker stack deploy --with-registry-auth --compose-file stack.yaml galaxy
```

默认发布 HTTP `8080` 和 SSH Relay `9522`。可在部署前通过
`GALAXY_HTTP_PORT`、`GALAXY_SSH_PORT` 修改。

查看状态：

```bash
docker stack services galaxy
docker service ps galaxy_galaxy --no-trunc
docker service logs galaxy_galaxy --tail 100
```

## 4. 更新

指定新版本后重新部署同一个 Stack：

```bash
export GALAXY_VERSION=<目标版本>
docker stack deploy --with-registry-auth --compose-file stack.yaml galaxy
```

更新前备份外部 MySQL，并确认 Docker Secret 仍存在。Galaxy 服务没有需要复制或恢复的
本地应用目录。

## 不推荐的方式

不要把单机 `compose.yaml` 直接交给 `docker stack deploy`。将 MySQL 或 Redis 简单约束到
一个带标签的节点只能避免正常调度迁移，无法在该节点故障时恢复服务，也不构成高可用。
