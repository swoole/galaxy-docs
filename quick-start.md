---
title: Docker 快速起步
icon: rocket
---

# Docker 快速起步

快速部署方式使用 Docker Compose 启动 CodeGalaxy、MySQL 和 Redis。安装器自动生成数据库
密码和应用密钥，首次启动时初始化空数据库。你只需在浏览器中设置第一个管理员账号。

默认从阿里云容器镜像服务安装当前稳定版
`registry.cn-shanghai.aliyuncs.com/swoole-public/galaxy:latest`。需要固定环境时，可以明确
指定版本号。

## 环境要求

- Linux x86_64 或 arm64 服务器
- Docker Engine
- Docker Compose v2（运行 `docker compose version` 可检查）
- `curl`
- 默认开放 TCP `8080`；使用容器 SSH 终端时还需开放 TCP `9522`

`galaxyctl` 是安装包自带的 Shell 脚本，安装和更新不需要 Go 环境。平台镜像内的 Go 服务
已经在发布镜像时编译完成。

建议准备一个可从浏览器和目标集群访问的域名。首次体验也可以直接使用服务器 IP。

## 一键安装

```bash
curl -fsSL https://git.code-galaxy.net/github/galaxy-docs/raw/branch/main/downloads/install.sh \
  | bash -s -- --url http://<服务器IP>:8080
```

固定安装 `1.0.0`：

```bash
curl -fsSL https://git.code-galaxy.net/github/galaxy-docs/raw/branch/main/downloads/install.sh \
  | bash -s -- --version 1.0.0 --url http://<服务器IP>:8080
```

安装文件默认保存在当前目录的 `galaxy/`。命令会：

1. 下载 Compose 文件和 `galaxyctl`。
2. 生成随机数据库密码、JWT 密钥、集群与 SSH Relay 密钥和一次性安装令牌。
3. 缺省从阿里云拉取 `registry.cn-shanghai.aliyuncs.com/swoole-public/galaxy:latest`，并拉取
   MySQL 8.0 和 Redis 镜像。
4. 创建持久化数据卷并启动服务。
5. 等待健康检查通过，然后输出首次初始化网址。

## 创建管理员

打开安装命令最后输出的网址，例如：

```text
http://192.0.2.10:8080/install#token=<一次性安装令牌>
```

安装页会先确认数据库连接，然后要求填写管理员邮箱、昵称和密码。数据库账号和密码由
安装器生成并保存在权限为 `0600` 的 `.env` 文件中，无需复制到网页。

创建成功后，安装页及初始化接口立即关闭并返回 `404`，不能再用安装令牌创建账号。随后
使用管理员账号登录并创建第一个组织；第一个组织默认是系统管理员组织。

## 常用命令

```bash
cd galaxy

./galaxyctl status              # 查看容器和访问地址
./galaxyctl doctor              # 检查 Docker、Compose 和配置
./galaxyctl logs                # 查看 CodeGalaxy 日志
./galaxyctl logs mysql          # 查看 MySQL 日志
./galaxyctl backup              # 立即备份数据库
./galaxyctl update <版本号>     # 备份并更新到指定版本
./galaxyctl stop
./galaxyctl start
```

安装命令输出丢失时，可以在服务器上重新取得初始化令牌：

```bash
cd galaxy
awk -F= '/^GALAXY_INSTALL_TOKEN=/{print $2}' .env
```

## 自定义端口

安装前或安装后编辑 `galaxy/.env`：

```dotenv
GALAXY_PUBLIC_URL=https://galaxy.example.com
GALAXY_HTTP_PORT=8080
GALAXY_SSH_PORT=9522
```

修改后执行：

```bash
./galaxyctl start
```

生产环境建议由现有反向代理提供 HTTPS，并将 `/agent/connect` 的 WebSocket 请求转发到
CodeGalaxy HTTP 端口。`GALAXY_PUBLIC_URL` 必须是浏览器和 Galaxy Agent 均可访问的站点
根地址，末尾不要添加 `/api`。

## 下一步

继续阅读[接入集群并发布项目](./tutorials/first-project.md)。
