---
title: 更新与备份
icon: cycle
---

# 更新与备份

## 快速部署更新

进入安装目录并指定目标版本：

```bash
cd galaxy
./galaxyctl update <目标版本>
```

更新过程会：

1. 使用 `mysqldump` 将数据库备份到 `backups/`。
2. 给当前应用镜像添加本地回滚标签。
3. 拉取 `phpswoole/galaxy:<目标版本>`。
4. 只重建 Galaxy 应用容器，保留 MySQL、Redis 和数据卷。
5. 等待健康检查；失败时自动恢复上一应用镜像。

数据库备份不会在失败时自动恢复，因为恢复会覆盖更新后产生的数据。数据库结构变化只能按
目标版本 Release Notes 声明的兼容路径升级。

更新后检查：

```bash
./galaxyctl status
./galaxyctl doctor
./galaxyctl logs
```

## 手动备份

```bash
./galaxyctl backup
ls -lh backups/
```

还应备份安装目录中的 `.env`。其中包含解密集群凭证和保持登录状态所需的固定密钥；重新
随机生成这些值会使已有密文或会话失效。

## 源码部署更新

1. 阅读目标版本的 Release Notes，确认 API、前端、Agent 和数据库兼容范围。
2. 备份 MySQL、API `.env`、前端 Nginx 配置和当前 Git 提交号。
3. 在测试环境用备份副本演练升级。
4. 先更新兼容新旧 Agent 的 API，再更新前端。
5. 验证登录、数据库、Redis、集群连接和一次 Docker 查询。
6. 最后逐个集群滚动更新 Agent。

不要使用新版 `database/init.sql` 覆盖已有数据库。该文件只用于初始化空库。

## Agent 更新

在 Swarm Manager 上执行：

```bash
sudo galaxy agent set \
  --image phpswoole/galaxy-agent:<版本>
```

使用固定版本标签。更新后检查：

```bash
docker service ps galaxy-agent
docker service inspect galaxy-agent --pretty
```

Manager Agent 在线后再继续更新下一个集群。部分 Worker 暂时离线时，平台显示为降级；
Manager 可用的集群仍可执行管理操作。

## 回滚

- 应用镜像健康检查失败时，`galaxyctl update` 自动切回本地回滚镜像。
- 源码部署需要切回上一 Git 提交和前端静态文件。
- Agent 可将 Service 镜像改回上一固定版本。
- API 回滚前先确认数据库结构仍与旧版本兼容。
