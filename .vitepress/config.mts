import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/galaxy/',
  lang: 'zh-CN',
  title: 'CodeGalaxy 文档',
  description: 'CodeGalaxy 自托管研发管理平台安装与使用文档',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#2463eb' }],
  ],
  themeConfig: {
    nav: [
      { text: '功能介绍', link: '/' },
      { text: '快速开始', link: '/quick-start' },
      { text: '安装', link: '/install' },
      { text: '更新', link: '/upgrade' },
      {
        text: 'GitHub',
        items: [
          { text: 'galaxy-api', link: 'https://github.com/swoole/galaxy-api' },
          { text: 'galaxy-fe', link: 'https://github.com/swoole/galaxy-fe' },
          { text: 'galaxy-cli', link: 'https://github.com/swoole/galaxy-cli' },
        ],
      },
    ],
    sidebar: [
      {
        text: '了解 CodeGalaxy',
        items: [
          { text: '系统功能介绍', link: '/' },
        ],
      },
      {
        text: '开始使用',
        items: [
          { text: 'Docker 快速起步', link: '/quick-start' },
          { text: '完整搭建教程', link: '/getting-started' },
          { text: '安装 CodeGalaxy', link: '/install' },
          { text: '接入集群并发布项目', link: '/tutorials/first-project' },
          { text: '更新与备份', link: '/upgrade' },
        ],
      },
    ],
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/swoole/galaxy-api' },
    ],
    editLink: {
      pattern: 'https://github.com/swoole/galaxy-docs/edit/master/:path',
      text: '在 GitHub 上编辑此页',
    },
    outline: {
      level: [2, 3],
      label: '本页目录',
    },
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
    lastUpdated: {
      text: '最后更新',
    },
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '外观',
  },
})
