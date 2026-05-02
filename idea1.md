# 九章甄选 — 国内云服务器部署方案建议

> 基于项目架构：Next.js 16 静态前端 + Node.js Relay 后端 + PostgreSQL/Redis 适配层
>
> 适用场景：国内 B2B AI 创作者商业撮合平台
>
> 日期：2026-05-02

---

## 一、项目架构概览

| 部分 | 技术 | 说明 |
|------|------|------|
| **前端** | Next.js 16 + React 19 + TailwindCSS v4 | `output: "export"` → 纯静态站点 |
| **后端 Relay** | 原生 Node.js HTTP 服务 (`relay/lead-relay.mjs`) | 独立于 Next.js，负责线索提交、认证、管理、支付 |
| **数据层** | PostgreSQL + Redis | `relay/database.mjs` 封装业务持久化，`relay/db.mjs` / `relay/redis.mjs` 是可替换适配层 |
| **通知渠道** | 飞书 Bitable / 企业微信群机器人 / 钉钉群机器人 | 线索自动分发 |
| **预留功能** | 微信支付、验证码、AI 诊断、管理后台 RBAC | 已有完整权限体系设计 |

---

## 二、推荐部署架构

采用 **“静态托管 + Relay 服务 + 托管 PostgreSQL/Redis”** 的混合部署。MVP 也可以把 PostgreSQL/Redis 临时装在同一台服务器，但生产更建议使用云厂商托管实例，并放在同一 VPC 内网。

### 架构图

```
┌─────────────────────────────────────────────┐
│           用户浏览器                          │
└──────────────┬──────────────────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌──────────────┐   ┌──────────────┐
│  CDN / OSS   │   │  云服务器    │
│  (静态前端)   │   │  (Relay后端) │
│  域名: www.  │   │  域名: api.  │
└──────────────┘   └──────┬───────┘
                          │
                   ┌──────┴──────┐
                   ▼             ▼
              ┌────────┐   ┌────────┐
              │PostgreSQL│  │ Redis  │
              │(托管内网)│  │(托管内网)│
              └────────┘   └────────┘
```

### Docker / systemd / PM2 怎么选？

1. 前端是纯静态导出，不需要容器。
2. Relay 是原生 Node.js HTTP 服务，可以用 PM2 或 systemd 直接托管。
3. 国内云服务器早期用 PM2 上手快；正式生产更推荐 systemd 或容器化，便于权限、日志和重启策略统一。
4. PostgreSQL/Redis 不建议和业务一起打进 Docker 镜像；云端用 RDS/Tair/Redis 托管，或至少独立数据目录和备份策略。

**什么时候上 Docker？**
- 团队 > 3 人，需要统一开发环境
- 需要跑多个服务（如接入 Elasticsearch、RabbitMQ）
- 准备上 K8s 做自动扩缩容
- 有 CI/CD 流水线，需要构建标准化镜像

---

## 三、云厂商选择建议

| 维度 | 建议 |
|------|------|
| **已有生态** | 如果已用微信登录、企业微信、腾讯云开发等，选 **腾讯云** |
| **价格** | 两者差不多，新用户都有优惠，可以比价后决定 |
| **AI 服务** | 阿里云通义千问、腾讯云混元，如果后期要接自家 AI，选对应云 |
| **备案** | B2B 网站需要 ICP 备案，两家流程类似，选一个就行 |

---

## 四、服务器配置推荐

| 阶段 | 配置 | 月费预估 | 说明 |
|------|------|----------|------|
| **MVP / 内测** | 2核4G + 3M 带宽 | ¥100-200 | 跑 Relay + PostgreSQL + Redis 足够 |
| **正式运营** | 4核8G + 5M 带宽 | ¥300-500 | 4核可用 PM2 cluster 模式跑多实例 |
| **数据库分离** | 4核8G 服务器 + 阿里云 RDS PostgreSQL | ¥600-1000 | 数据量大了单独买 RDS |

> 💡 **省钱技巧**：内测可以用轻量应用服务器，但正式运营如果涉及真实企业线索、账号、付款，建议至少把 PostgreSQL/Redis 放到同区域 VPC 内的托管实例，避免单机磁盘/备份风险。

---

## 五、Linux 环境依赖清单（Ubuntu 24.04 LTS）

### 5.1 系统基础

```bash
# 可先替换为国内 apt 镜像源（阿里云/腾讯云/清华源），再更新系统
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git vim nginx ufw fail2ban ca-certificates gnupg

# 创建非 root 运行用户
sudo useradd --system --create-home --shell /usr/sbin/nologin jiuzhang
sudo mkdir -p /opt/jiuzhang-relay
sudo chown -R jiuzhang:jiuzhang /opt/jiuzhang-relay
```

### 5.2 Node.js 环境

```bash
# 方式一：NodeSource。若国内访问慢，先配置代理或改用镜像源/二进制包。
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PM2（进程管理）。也可以改用 systemd，见下方建议。
sudo npm install -g pm2
```

> 国内服务器如果访问 NodeSource 或 npm registry 慢，可以临时设置 `npm config set registry https://registry.npmmirror.com`。生产构建仍建议固定 `package-lock.json` 并使用 `npm ci`。

### 5.3 Web 服务器

```bash
# Nginx 已在基础安装中包含，配置见下方
```

### 5.4 数据库

```bash
# 仅本机模拟或低成本内测时安装。本项目已支持 DATABASE_URL / REDIS_URL 指向云托管实例。
sudo apt install -y postgresql postgresql-contrib

sudo apt install -y redis-server
```

生产注意：
- PostgreSQL/Redis 不要开放公网；云端用 VPC 内网地址。
- Redis 必须设置密码，能开启 TLS 就开启。
- PostgreSQL 使用应用低权限账号，不要用超级管理员账号跑业务。
- `.env` 权限建议 `chmod 600`，属主为运行用户。

---

## 六、分步部署流程

### Step 1：前端部署（CDN / OSS）

`next.config.ts` 已设置 `output: "export"`，构建产物在 `out/` 目录。

```bash
# 在本地/CI 中
npm ci
npm run build          # 生成 out/ 目录
```

**上传到阿里云 OSS / 腾讯云 COS + CDN 加速：**
1. 开通 CDN + OSS/COS
2. 将 `out/` 目录上传到 bucket
3. 绑定域名（如 `www.jiuzhang-zhenxuan.com`）
4. 开启 HTTPS（免费 SSL 证书）

> 前端全球访问都快，几乎没有服务器成本。

### Step 2：Relay 后端部署（云服务器）

```bash
# 登录服务器后
cd /opt
sudo -u jiuzhang git clone <你的仓库> jiuzhang-relay
cd jiuzhang-relay

# 只安装生产依赖（不需要 devDependencies）
sudo -u jiuzhang npm ci --omit=dev

# 创建环境变量文件
sudo -u jiuzhang nano /opt/jiuzhang-relay/.env
sudo chmod 600 /opt/jiuzhang-relay/.env
```

#### 环境变量配置（`.env`）

```env
# Relay 服务
LEAD_RELAY_PORT=8787
LEAD_RELAY_SECRET=你的32位随机密钥
LEAD_ALLOWED_ORIGINS=https://www.jiuzhang-zhenxuan.com
LEAD_CHANNELS=feishu,wecom,dingtalk
LEAD_REQUEST_TIMEOUT_MS=8000
LEAD_RATE_LIMIT_WINDOW_MS=60000
LEAD_RATE_LIMIT_MAX=100

# 关闭 Dry Run，正式环境
LEAD_RELAY_DRY_RUN=false
LEAD_CAPTCHA_REQUIRED=true
CAPTCHA_PROVIDER=geetest
CAPTCHA_SECRET_KEY=你的验证码密钥

# 数据库与 Redis（可指向云厂商托管实例的 VPC 内网地址）
DATABASE_URL=postgresql://user:pass@localhost:5432/jiuzhang
REDIS_URL=redis://:password@localhost:6379
DB_INIT_CREATE_DATABASE=false
DATABASE_POOL_MAX=20
DATABASE_CONNECTION_TIMEOUT_MS=5000
REDIS_MAX_RETRIES_PER_REQUEST=3

# 飞书
FEISHU_APP_ID=xxx
FEISHU_APP_SECRET=xxx
FEISHU_APP_TOKEN=xxx
FEISHU_DEMAND_TABLE_ID=xxx
FEISHU_APPLICATION_TABLE_ID=xxx

# 企业微信
WECOM_BOT_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/xxx

# 钉钉
DINGTALK_BOT_WEBHOOK_URL=https://oapi.dingtalk.com/robot/xxx
DINGTALK_BOT_SECRET=xxx

# 微信支付
WECHAT_PAY_APP_ID=xxx
WECHAT_PAY_MCH_ID=xxx
WECHAT_PAY_SERIAL_NO=xxx
WECHAT_PAY_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nxxx
WECHAT_PAY_API_V3_KEY=xxx
```

初始化数据库：

```bash
# 云端通常由控制台先创建数据库和账号，DB_INIT_CREATE_DATABASE 保持 false
sudo -u jiuzhang npm run db:init
```

如果是自建 PostgreSQL 且当前账号确实有建库权限，才临时设置：

```bash
DB_INIT_CREATE_DATABASE=true sudo -u jiuzhang npm run db:init
```

### Step 3：PM2 启动 Relay

创建 PM2 配置文件 `/opt/jiuzhang-relay/ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'jiuzhang-relay',
    script: './relay/lead-relay.mjs',
    instances: 1,           // 单核先跑1个，4核服务器可改为 'max'
    exec_mode: 'fork',      // 原生 HTTP 服务用 fork
    env: {
      NODE_ENV: 'production'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '300M',
    restart_delay: 3000,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false,
    kill_timeout: 5000
  }]
};
```

启动命令：

```bash
# 创建日志目录
mkdir -p /opt/jiuzhang-relay/logs

# 启动
cd /opt/jiuzhang-relay
pm2 start ecosystem.config.js --env production

# 保存配置，开机自启
pm2 save
pm2 startup systemd
```

> PM2 可用于内测和早期生产。更严格的生产环境建议改成 systemd unit，让服务以 `jiuzhang` 用户运行，并由系统日志统一采集。

### Step 4：Nginx 反向代理 + SSL

创建配置文件 `/etc/nginx/sites-available/jiuzhang-api`：

```nginx
# 限频区域定义。该文件被 nginx.conf include 到 http {} 内时有效。
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

upstream relay_backend {
    server 127.0.0.1:8787;
    keepalive 32;
}

server {
    listen 80;
    server_name api.jiuzhang-zhenxuan.com;

    # 强制跳转 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.jiuzhang-zhenxuan.com;

    # SSL 证书（阿里云/腾讯云都提供免费证书）
    ssl_certificate /etc/nginx/ssl/jiuzhang-api.crt;
    ssl_certificate_key /etc/nginx/ssl/jiuzhang-api.key;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 日志
    access_log /var/log/nginx/jiuzhang-api.access.log;
    error_log /var/log/nginx/jiuzhang-api.error.log;
    client_max_body_size 128k;

    # 反向代理到 Relay
    location / {
        proxy_pass http://relay_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置（B2B 表单可能慢）
        proxy_connect_timeout 10s;
        proxy_send_timeout 15s;
        proxy_read_timeout 15s;

        # 限频（比 Relay 更前置一层防护）
        limit_req zone=api_limit burst=20 nodelay;
    }

    # 健康检查
    location /healthz {
        proxy_pass http://relay_backend;
        access_log off;
    }
}

```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/jiuzhang-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5：防火墙 + 安全加固

```bash
# 只开放必要端口
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# fail2ban 防暴力破解
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

补充建议：
- 云安全组也只开放 22、80、443；PostgreSQL/Redis 端口仅允许内网或不开放。
- SSH 禁止密码登录，改用密钥登录；root 直登尽量关闭。
- 定期快照和数据库备份，至少保留 7 天。
- `.env`、数据库备份、日志不要上传到公开仓库或公共对象存储。

---

## 七、扩展依赖（根据功能需求选配）

| 功能 | 组件 | 说明 |
|------|------|------|
| 消息队列（异步任务） | RabbitMQ 或 Redis Stream | 邮件通知、数据同步 |
| 全文搜索（需求/供给检索） | Elasticsearch 或 Meilisearch | 服务商/案例搜索 |
| 文件存储（文档/图片） | 阿里云 OSS / 腾讯云 COS | 和服务器同一家，内网传输免费 |
| 监控与日志 | 阿里云/腾讯云云监控 + Prometheus + Grafana | 基础资源监控 + 自定义指标 |

---

## 八、下一步行动清单

1. [ ] **部署静态前端** → CDN / OSS，当天可搞定
2. [ ] **服务器跑通 Relay** → 按上方脚本执行
3. [ ] **初始化 PostgreSQL/Redis** → 配好 `DATABASE_URL` / `REDIS_URL` 后执行 `npm run db:init`
4. [ ] **接入正式通知渠道** → 飞书 Bitable / 企业微信机器人 / 钉钉
5. [ ] **ICP 备案** → B2B 网站必备，提前启动流程
6. [ ] **SSL 证书** → 阿里云/腾讯云免费证书，绑定域名

---

*文档由 AI 助手整理生成，并已按当前项目 PostgreSQL/Redis 接入状态和国内云服务器部署习惯做本地化调整。*
