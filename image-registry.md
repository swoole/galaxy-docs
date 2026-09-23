---
title: 镜像仓库对照表
description: Docker Hub 或原始上游镜像与 swoole-public 镜像的对应关系
---

# 镜像仓库对照表

CodeGalaxy 默认使用阿里云上海地域的 `swoole-public` 公开仓库，以便在中国大陆网络环境中直接拉取。若服务器能够稳定访问 Docker Hub、GCR 等原始仓库，也可以按下表替换为上游镜像。

两个仓库中的同一行使用相同的镜像内容和标签。建议一次只替换一个完整镜像地址，不要只替换仓库域名，因为部分上游镜像还包含组织名。

## CodeGalaxy 镜像

| Docker Hub | swoole-public（默认） |
| --- | --- |
| `phpswoole/galaxy:<版本>` | `registry.cn-shanghai.aliyuncs.com/swoole-public/galaxy:<版本>` |
| `phpswoole/galaxy-agent:<版本>` | `registry.cn-shanghai.aliyuncs.com/swoole-public/galaxy-agent:<版本>` |

未指定版本时，Galaxy 使用 `latest`。生产环境建议指定发布版本，例如 `1.0.0`。

## 安装和基础运行镜像

| Docker Hub／原始上游 | swoole-public（默认） |
| --- | --- |
| `mysql:8.0` | `registry.cn-shanghai.aliyuncs.com/swoole-public/mysql:8.0` |
| `redis:7.4-alpine` | `registry.cn-shanghai.aliyuncs.com/swoole-public/redis:7.4-alpine` |
| `node:14-alpine` | `registry.cn-shanghai.aliyuncs.com/swoole-public/node:14-alpine` |
| `node:22-alpine` | `registry.cn-shanghai.aliyuncs.com/swoole-public/node:22-alpine` |
| `nginx:stable` | `registry.cn-shanghai.aliyuncs.com/swoole-public/nginx:stable` |
| `golang:1.24-alpine` | `registry.cn-shanghai.aliyuncs.com/swoole-public/golang:1.24-alpine` |
| `golang:1.26-alpine` | `registry.cn-shanghai.aliyuncs.com/swoole-public/golang:1.26-alpine` |
| `alpine:3.22` | `registry.cn-shanghai.aliyuncs.com/swoole-public/alpine:3.22` |
| `hyperf/hyperf:8.4-alpine-v3.21-swoole` | `registry.cn-shanghai.aliyuncs.com/swoole-public/hyperf:8.4-alpine-v3.21-swoole` |
| `gitpod/openvscode-server:latest` | `registry.cn-shanghai.aliyuncs.com/swoole-public/openvscode-server:latest` |

## 集群和平台服务镜像

| Docker Hub／原始上游 | swoole-public（默认） |
| --- | --- |
| `rancher/rancher:v2.14.2` | `registry.cn-shanghai.aliyuncs.com/swoole-public/rancher:v2.14.2` |
| `prom/prometheus:v3.2.1` | `registry.cn-shanghai.aliyuncs.com/swoole-public/prometheus:v3.2.1` |
| `prom/node-exporter:v1.8.2` | `registry.cn-shanghai.aliyuncs.com/swoole-public/node-exporter:v1.8.2` |
| `gcr.io/cadvisor/cadvisor:v0.49.1` | `registry.cn-shanghai.aliyuncs.com/swoole-public/cadvisor:v0.49.1` |
| `traefik:v3.7` | `registry.cn-shanghai.aliyuncs.com/swoole-public/traefik:v3.7` |
| `tecnativa/docker-socket-proxy:latest` | `registry.cn-shanghai.aliyuncs.com/swoole-public/docker-socket-proxy:latest` |
| `fatedier/frpc:v0.69.0` | `registry.cn-shanghai.aliyuncs.com/swoole-public/frpc:v0.69.0` |
| `fatedier/frps:v0.69.0` | `registry.cn-shanghai.aliyuncs.com/swoole-public/frps:v0.69.0` |

## 项目构建镜像

| Docker Hub／原始上游 | swoole-public（默认） |
| --- | --- |
| `docker/dockerfile:1` | `registry.cn-shanghai.aliyuncs.com/swoole-public/dockerfile:1` |
| `docker/dockerfile:1.7` | `registry.cn-shanghai.aliyuncs.com/swoole-public/dockerfile:1.7` |
| `moby/buildkit:v0.31.1-rootless` | `registry.cn-shanghai.aliyuncs.com/swoole-public/buildkit:v0.31.1-rootless` |
| `moby/buildkit:v0.31.1` | `registry.cn-shanghai.aliyuncs.com/swoole-public/buildkit:v0.31.1` |
| `alpine/git:latest` | `registry.cn-shanghai.aliyuncs.com/swoole-public/git:latest` |
| `golang:1.24-bookworm` | `registry.cn-shanghai.aliyuncs.com/swoole-public/golang:1.24-bookworm` |
| `golang:1.25-bookworm` | `registry.cn-shanghai.aliyuncs.com/swoole-public/golang:1.25-bookworm` |
| `node:20-bookworm` | `registry.cn-shanghai.aliyuncs.com/swoole-public/node:20-bookworm` |
| `node:20-bookworm-slim` | `registry.cn-shanghai.aliyuncs.com/swoole-public/node:20-bookworm-slim` |
| `node:22-bookworm` | `registry.cn-shanghai.aliyuncs.com/swoole-public/node:22-bookworm` |
| `node:22-bookworm-slim` | `registry.cn-shanghai.aliyuncs.com/swoole-public/node:22-bookworm-slim` |
| `node:24-bookworm` | `registry.cn-shanghai.aliyuncs.com/swoole-public/node:24-bookworm` |
| `node:24-bookworm-slim` | `registry.cn-shanghai.aliyuncs.com/swoole-public/node:24-bookworm-slim` |
| `nginx:1.27-alpine` | `registry.cn-shanghai.aliyuncs.com/swoole-public/nginx:1.27-alpine` |
| `composer:2` | `registry.cn-shanghai.aliyuncs.com/swoole-public/composer:2` |
| `php:8.3-cli-bookworm` | `registry.cn-shanghai.aliyuncs.com/swoole-public/php:8.3-cli-bookworm` |
| `php:8.3-fpm-bookworm` | `registry.cn-shanghai.aliyuncs.com/swoole-public/php:8.3-fpm-bookworm` |
| `php:8.4-cli-bookworm` | `registry.cn-shanghai.aliyuncs.com/swoole-public/php:8.4-cli-bookworm` |
| `php:8.4-fpm-bookworm` | `registry.cn-shanghai.aliyuncs.com/swoole-public/php:8.4-fpm-bookworm` |
| `php:8.5-cli-bookworm` | `registry.cn-shanghai.aliyuncs.com/swoole-public/php:8.5-cli-bookworm` |
| `php:8.5-fpm-bookworm` | `registry.cn-shanghai.aliyuncs.com/swoole-public/php:8.5-fpm-bookworm` |
| `dunglas/frankenphp:php8.3-bookworm` | `registry.cn-shanghai.aliyuncs.com/swoole-public/frankenphp:php8.3-bookworm` |
| `dunglas/frankenphp:php8.4-bookworm` | `registry.cn-shanghai.aliyuncs.com/swoole-public/frankenphp:php8.4-bookworm` |
| `dunglas/frankenphp:php8.5-bookworm` | `registry.cn-shanghai.aliyuncs.com/swoole-public/frankenphp:php8.5-bookworm` |
| `debian:bookworm-slim` | `registry.cn-shanghai.aliyuncs.com/swoole-public/debian:bookworm-slim` |
| `gcr.io/distroless/static-debian12:latest` | `registry.cn-shanghai.aliyuncs.com/swoole-public/static-debian12:latest` |
| `gcr.io/distroless/static-debian12:nonroot` | `registry.cn-shanghai.aliyuncs.com/swoole-public/static-debian12:nonroot` |
| `python:3.11-slim-bookworm` | `registry.cn-shanghai.aliyuncs.com/swoole-public/python:3.11-slim-bookworm` |
| `python:3.12-slim-bookworm` | `registry.cn-shanghai.aliyuncs.com/swoole-public/python:3.12-slim-bookworm` |
| `python:3.13-slim-bookworm` | `registry.cn-shanghai.aliyuncs.com/swoole-public/python:3.13-slim-bookworm` |
| `eclipse-temurin:17-jre` | `registry.cn-shanghai.aliyuncs.com/swoole-public/eclipse-temurin:17-jre` |
| `eclipse-temurin:21-jre` | `registry.cn-shanghai.aliyuncs.com/swoole-public/eclipse-temurin:21-jre` |
| `eclipse-temurin:22-jre` | `registry.cn-shanghai.aliyuncs.com/swoole-public/eclipse-temurin:22-jre` |
| `gradle:8-jdk17` | `registry.cn-shanghai.aliyuncs.com/swoole-public/gradle:8-jdk17` |
| `gradle:8-jdk21` | `registry.cn-shanghai.aliyuncs.com/swoole-public/gradle:8-jdk21` |
| `gradle:8.8.0-jdk22` | `registry.cn-shanghai.aliyuncs.com/swoole-public/gradle:8.8.0-jdk22` |
| `maven:3.9-eclipse-temurin-17` | `registry.cn-shanghai.aliyuncs.com/swoole-public/maven:3.9-eclipse-temurin-17` |
| `maven:3.9-eclipse-temurin-21` | `registry.cn-shanghai.aliyuncs.com/swoole-public/maven:3.9-eclipse-temurin-21` |
| `maven:3.9-eclipse-temurin-22` | `registry.cn-shanghai.aliyuncs.com/swoole-public/maven:3.9-eclipse-temurin-22` |

## 如何切换

快速安装中的 Galaxy 主镜像可以通过环境变量切换：

```bash
GALAXY_IMAGE=phpswoole/galaxy GALAXY_VERSION=1.0.0 docker compose up -d
```

MySQL 和 Redis 镜像写在下载的 `compose.yaml` 中，按表格替换对应的 `image:` 值即可。平台中的集群服务和项目构建镜像可在相应设置页面填写上游地址。

替换后可先验证镜像是否能从当前服务器拉取：

```bash
docker pull mysql:8.0
docker pull redis:7.4-alpine
docker pull phpswoole/galaxy:1.0.0
```

