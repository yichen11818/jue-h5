# 撅一下 · 纯前端双人 QQ 表情 H5

输入两个 QQ 号，或上传两个头像，在浏览器本地生成并下载三帧循环 GIF。支持交换双方、手机长按保存、错误提示。无需服务端、数据库、登录或 API Key。

## 本地开发

```sh
npm ci
npm run dev
npm run build
```

Netlify 构建命令 `npm run build`，发布目录 `dist`。配置见 `netlify.toml`。

## 来源与实现

从 Yumi 机器人的 `services/meme_generator.py` 中提取「撅 → do」映射。模板来自 [MemeCrafters/meme-generator-contrib](https://github.com/MemeCrafters/meme-generator-contrib/tree/8547f2e5718bfbb3328d700fe2c21d2ec5962500/memes/do)，固定版本 `8547f2e5718bfbb3328d700fe2c21d2ec5962500`。原许可见 `THIRD-PARTY-LICENSE`。

保留原版 300×300 三帧素材、50ms 帧间隔、头像尺寸、圆形裁剪、15°/90° 旋转及逐帧坐标。第一个 QQ 为发起者，第二个 QQ 为目标。Canvas 合成，gifenc 编码，无运行时 CDN 脚本依赖。

QQ 头像接口没有开放 CORS，因此通过 wsrv.nl（备用 images.weserv.nl）公共图片代理获取头像；号码会发送给代理及 QQ 头像服务，代理可能缓存头像。服务不可用时可上传头像。上传文件和生成结果只在当前浏览器内存处理，本站不存储 QQ 号、头像或生成结果。QQ 服务可能对无效、停用或隐藏头像的号码返回默认头像，本站无法判断账号是否存在。

仅供朋友间娱乐。
