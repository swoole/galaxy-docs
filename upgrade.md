---
title: 更新与备份
icon: cycle
---

# 更新与备份

统一的 `galaxyctl upgrade` 正在设计中。当前源码版本尚未提供完整的自动数据库升级链，
请不要直接用最新的 `database/init.sql` 覆盖现有数据库。

## 当前安全流程

1. 阅读目标版本的 Release Notes，确认是否包含数据库变更。
2. 备份 MySQL、API `.env`、前端 Nginx 配置和当前镜像或 Git 提交号。
3. 在测试环境使用备份副本演练升级。
4. 先更新兼容新旧 Agent 的 API，再更新前端。
5. 验证登录、数据库、Redis、集群 Agent 和一次 Docker 查询。
6. 最后逐个集群滚动更新 Agent。

数据库备份示例：

```bash
mysqldump --single-transaction --routines --triggers \
  -h127.0.0.1 -ugalaxy -p code_galaxy \
  > galaxy-$(date +%Y%m%d-%H%M%S).sql
```

## Agent 更新

在 Swarm Manager 上执行：

```bash
sudo galaxy agent set \
  --image <所有 Swarm 节点可访问的 Agent 镜像>:<版本>
```

使用固定版本标签。更新后检查：

```bash
docker service ps galaxy-agent
docker service inspect galaxy-agent --pretty
```

Manager Agent 在线后再继续更新下一个集群。部分 Worker 暂时离线时，平台应显示为降级，
但 Manager 可用的集群仍然可以执行管理操作。

## 回滚原则

- 前端回滚到上一份静态文件或上一镜像。
- API 回滚前确认数据库仍与旧版兼容。
- Agent 可将 Service 镜像改回上一固定版本。
- 恢复数据库会覆盖备份之后产生的数据，只在确认需要时执行。

正式发行安装器将自动完成兼容检查、升级锁、备份、数据库迁移、健康检查和应用镜像回滚。
