# CodeGalaxy 用户文档

此目录是 CodeGalaxy 对外用户文档的唯一维护位置，包含系统功能介绍、安装、升级、集群
接入和项目发布教程。

内部架构、设计决策和开发过程文档不放入本目录。

## 本地运行

```bash
npm install
npm run docs:dev
```

默认访问 `http://localhost:5173`。允许局域网访问：

```bash
npm run docs:dev -- --host 0.0.0.0
```

## 构建

```bash
npm run docs:build
npm run docs:preview
```

静态文件输出到 `.vitepress/dist/`。

## 内容规则

- 只记录用户已经可以使用的功能。
- 尚未发布的安装器和升级器应明确标记为规划内容。
- 示例域名、镜像和凭据必须使用占位值。
- 产品行为变化时，同一个 Pull Request 应更新相关用户文档。
