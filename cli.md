# Galaxy CLI 使用指南

`galaxy` 是 CodeGalaxy 的命令行客户端，用于登录管理中心、关联本地项目、构建和发布应用、
操作项目容器，以及在 Docker Swarm Manager 上安装 Galaxy Agent。

## CLI 与 Agent 的关系

| 组件 | 运行方式 | 用途 |
| --- | --- | --- |
| `galaxy` | 用户按需执行 | 项目操作、容器操作、安装和更新 Agent、本机 Docker 工具 |
| `galaxy-agent` | Swarm Global Service 常驻运行 | 每个 Swarm 节点主动连接 Galaxy API，并执行已授权的集群操作 |

CLI 不需要常驻运行。执行 `galaxy agent install` 后，真正保持连接的是部署到 Swarm 各节点的
`galaxy-agent` Service。

## 安装

### Linux 和 macOS

```bash
curl -sS https://s.code-galaxy.net/cli-install.sh | bash -
galaxy version
```

安装程序会下载与当前操作系统和 CPU 架构匹配的可执行文件，并提示是否安装到
`/usr/local/bin/galaxy`。

### Windows

下载并运行 `cli-install.bat`，然后在 PowerShell 中验证：

```powershell
galaxy.exe version
```

### 从源码构建

只有从源码构建 CLI 才需要 Go 环境。直接使用安装程序下载的可执行文件不需要安装 Go。

源码当前使用 Go 1.26.4：

```bash
git clone https://github.com/swoole/galaxy-cli.git
cd galaxy-cli
make build VERSION=<版本>
sudo install -m 0755 galaxy /usr/local/bin/galaxy
```

`make build` 会生成静态可执行文件，不依赖目标机器的 glibc 或 musl。

## 配置管理中心

自建 CodeGalaxy 时，`--server` 应填写用户访问的站点根地址，不要附加 `/api`：

```bash
galaxy login \
  --server https://galaxy.example.com \
  --username your-name
```

命令会安全提示输入密码。自动化环境可从标准输入传入：

```bash
printf '%s\n' "$GALAXY_PASSWORD" | galaxy login \
  --server https://galaxy.example.com \
  --username your-name \
  --password-stdin
```

也可以通过环境变量设置默认地址：

```bash
export GALAXY_BASE_URL=https://galaxy.example.com
```

CLI 将账号配置保存在 `~/.galaxy/config`。每个项目的关联信息保存在项目根目录的
`.galaxy/project.yaml`。项目配置会记录其所属管理中心，因此完成 `galaxy init` 后，通常不需要
在每条项目命令中重复传入 `--server`。

查看当前用户、组织、项目和 CLI 版本：

```bash
galaxy info
galaxy version
```

退出当前管理中心：

```bash
galaxy logout --server https://galaxy.example.com
```

## 关联项目

进入 Git 工作区后执行：

```bash
cd /path/to/project
galaxy init --server https://galaxy.example.com
```

CLI 会引导选择组织、项目组和已有项目。当前目录已经是 Git 仓库时，会核对远程仓库地址；
空目录可以选择已有项目并克隆其仓库。

常用初始化参数：

| 参数 | 说明 |
| --- | --- |
| `--org-name` | 直接指定组织名称 |
| `--group-name` | 直接指定项目组名称 |
| `--remote-name` | Git 存在多个 remote 时指定名称 |
| `--create` | 创建新项目，不选择已有项目 |
| `--projectroot` | 指定项目根目录，默认自动使用当前 Git 工作区 |

验证关联结果：

```bash
galaxy info
galaxy list project
```

切换默认上下文：

```bash
galaxy switch organization --org my-org
galaxy switch group --org my-org --group backend
galaxy switch project --project api-service
```

## 构建与发布

### 查看流水线并构建

```bash
galaxy list pipeline
galaxy build --pipeline production --message "release candidate"
```

可以指定 Git Commit 或 Tag：

```bash
galaxy build --pipeline production --commit <commit-id>
galaxy build --pipeline production --tag v1.2.0
```

查看构建记录和日志：

```bash
galaxy list build
galaxy watch --build-id <构建ID>
```

### 发布镜像

```bash
galaxy deploy --latest --message "deploy latest image"
```

也可以按 Commit 或 Tag 选择镜像：

```bash
galaxy deploy --commit <commit-id>
galaxy deploy --tag v1.2.0
```

使用 `--new-instance` 创建新实例，使用 `--yes` 跳过发布确认。发布完成后可查看资源：

```bash
galaxy list deploy
galaxy list instance
galaxy list container <实例名称>
```

### 扩缩容、重启和回滚

```bash
galaxy scale <实例名称> --replicas 3
galaxy reload instance
galaxy rollback <发布ID>
```

省略发布 ID 时，`rollback` 会显示可选的历史发布记录。重启实例时 CLI 会交互选择目标实例。

## 操作项目容器

以下命令通过 Galaxy API 和目标节点 Agent 操作当前项目的 Swarm 容器。

### 执行命令

```bash
galaxy exec web -- php -v
galaxy exec web -- pwd
galaxy exec -it web
```

`web` 可以是 Runtime 名称、容器名称或容器 ID。使用 `--container` 可以明确选择某个副本：

```bash
galaxy exec --container <容器ID> -- php -v
```

### 复制文件

```bash
# 本地复制到容器
galaxy cp ./config.php web:/var/www/html/config.php

# 容器复制到本地
galaxy cp web:/var/log/app.log ./app.log
```

源路径与目标路径必须恰好有一个是容器路径。

## 对比和同步开发文件

`galaxy diff` 和 `galaxy sync` 默认读取当前 Git 工作区中新增、修改和删除的文件。

先查看差异：

```bash
galaxy diff development
```

同步新增和修改的文件：

```bash
galaxy sync development --dry-run
galaxy sync development
```

默认不会删除实例中的文件。需要同步 Git 删除记录时显式添加 `--delete`：

```bash
galaxy sync development --delete --dry-run
galaxy sync development --delete
```

`--delete` 只删除文件，不删除目录。如果目标路径在容器中是目录，CLI 会停止同步并报告冲突。

### 指定变更范围

```bash
galaxy diff development --commit <基准commit>
galaxy sync development --commit <基准commit>
```

这会处理指定 Commit 之后直到当前工作区的全部变更。还可以指定容器和容器内项目目录：

```bash
galaxy sync development \
  --container <容器ID> \
  --remote-root /var/www/html
```

### `.galaxyignore`

在项目根目录创建 `.galaxyignore`，阻止敏感文件或本地文件被同步：

```gitignore
.env
config/*-local.php
secrets/**
!secrets/example.env
```

规则语法与 `.gitignore` 类似，后面的规则优先。`.galaxyignore` 自身不会被同步；它只影响
`galaxy sync`，不会隐藏 `galaxy diff` 的结果。

## 路由与证书

为项目实例创建 Web 路由：

```bash
galaxy route api.example.com \
  --instance web \
  --service web \
  --port 8080 \
  --location /
```

启用 HTTPS 并使用已有证书：

```bash
galaxy route api.example.com \
  --instance web \
  --service web \
  --port 8080 \
  --https \
  --force-https \
  --cert-name api.example.com
```

也可以导入本地证书：

```bash
galaxy route api.example.com \
  --instance web \
  --service web \
  --port 8080 \
  --https \
  --cert-pem ./fullchain.pem \
  --private-key ./privkey.pem
```

相关资源命令：

```bash
galaxy list route
galaxy list domain
galaxy list certificate
galaxy edit domain api.example.com
galaxy delete route --location /
```

## 安装和维护 Swarm Agent

在 Web 控制台的 Swarm 连接页面生成 Bootstrap Token，然后在 Swarm Manager 执行页面给出的
完整命令：

```bash
sudo galaxy agent install \
  --server https://galaxy.example.com \
  --bootstrap-token <一次性Token> \
  --image registry.cn-shanghai.aliyuncs.com/swoole-public/galaxy-agent:<版本>
```

Bootstrap Token 有效期为 15 分钟且只能使用一次。避免把 Token 写入 Shell 历史时，可以使用
权限受控文件：

```bash
sudo galaxy agent install \
  --server https://galaxy.example.com \
  --bootstrap-token-file /run/secrets/galaxy-bootstrap-token
```

更新 Agent 的 API 地址或镜像：

```bash
sudo galaxy agent set --server https://galaxy.example.com
sudo galaxy agent set \
  --image registry.cn-shanghai.aliyuncs.com/swoole-public/galaxy-agent:<版本>
```

`agent set` 只操作带 Galaxy 管理标签的 Global Service，并保留已有 Secret、网络和其他部署
配置。生产环境建议使用不可变版本标签更新 Agent。

## 本机 Docker 工具

`galaxy docker` 直接访问当前主机的 Docker Engine，不登录 Galaxy，也不调用 Galaxy API。

### Compose 操作

常用 Docker Compose 命令可以直接透传：

```bash
galaxy docker compose config
galaxy docker compose pull
galaxy docker compose up -d
galaxy docker compose logs -f
galaxy docker compose down
```

列出本机 Compose 项目：

```bash
galaxy docker compose list
galaxy docker compose list --format json
```

将 Compose 项目迁移为 Swarm Stack：

```bash
galaxy docker compose migrate --project my-app
```

命令会先检查 Compose 配置、容器、挂载、端口、放置约束和同名 Stack。检查通过后才会请求
确认并执行迁移。自动化场景可使用 `--yes`；该参数不会跳过迁移完成后的旧容器清理确认。

### 独立容器迁移

```bash
galaxy docker container list
galaxy docker container migrate \
  --container my-app \
  --stack my-app \
  --service my-app
```

迁移失败时会删除新 Stack 并重新启动原容器。Volume 和绑定目录中的数据不会被删除。

## 全局参数

全局参数可以放在任意子命令后：

| 参数 | 说明 |
| --- | --- |
| `--server`、`-s` | Galaxy 管理中心根地址 |
| `--config` | CLI 用户配置文件，默认 `~/.galaxy/config` |
| `--projectroot` | 项目根目录 |
| `--token` | 临时指定 API Token |
| `--request-timeout` | 单次请求超时，如 `30s`、`2m`；`0` 表示不限制 |
| `--debug` | 输出调试日志 |
| `--help`、`-h` | 显示当前命令帮助 |

需要确认某个命令的当前参数时，以内置帮助为准：

```bash
galaxy --help
galaxy sync --help
galaxy agent install --help
```

## 命令速查

| 命令 | 用途 |
| --- | --- |
| `login` / `logout` / `info` | 登录、退出和查看当前上下文 |
| `init` / `switch` | 关联项目和切换组织、项目组、项目 |
| `list` | 查看组织、项目、流水线、构建、镜像、集群、实例等资源 |
| `build` / `watch` | 发起构建和查看构建日志 |
| `deploy` / `rollback` | 发布和回滚项目 |
| `scale` / `reload` | 调整副本数和重启实例 |
| `exec` / `cp` | 在项目容器执行命令和复制文件 |
| `diff` / `sync` | 对比和同步 Git 工作区文件 |
| `route` / `create` / `edit` / `delete` | 管理路由、域名和证书 |
| `agent install` / `agent set` | 安装和维护 Swarm Global Agent |
| `docker compose` / `docker container` | 操作本机 Docker 和执行迁移 |
| `upgrade` | 更新 CLI 可执行文件 |
| `completion` / `autocompletion` | 生成或安装 Shell 自动补全 |
| `version` | 查看 CLI 版本 |

## 更新和自动补全

更新 CLI：

```bash
galaxy upgrade
```

如果可执行文件位于 `/usr/local/bin` 且当前用户没有写权限：

```bash
sudo galaxy upgrade
```

生成补全脚本：

```bash
galaxy completion bash
galaxy completion zsh
galaxy completion fish
galaxy completion powershell
```

也可以让 CLI 自动安装当前平台支持的补全配置：

```bash
galaxy autocompletion
```

## 常见问题

### 提示尚未登录

确认当前命令连接的是正确的管理中心：

```bash
galaxy login --server https://galaxy.example.com --username your-name
galaxy info --server https://galaxy.example.com
```

### 提示当前目录不是 Galaxy 项目

进入 Git 项目根目录执行 `galaxy init`，或者通过 `--projectroot` 明确指定根目录。

### 项目连接到了错误的管理中心

项目的 `.galaxy/project.yaml` 会保存管理中心地址。使用正确的 `--server` 重新执行
`galaxy init`，让 CLI 重新关联项目。

### Agent 安装后集群仍然离线

确认 `--server` 使用 Swarm 各节点均可访问的域名或 IP，不能使用 `localhost` 或
`127.0.0.1`。然后检查 Global Service：

```bash
docker service ps galaxy-agent
docker service logs galaxy-agent
```

地址或镜像填写错误时使用 `galaxy agent set` 修正。
