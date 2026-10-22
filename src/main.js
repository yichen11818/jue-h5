import './style.css';
import { decode, loadAvatar, renderMeme, sampleAvatar } from './meme.js';

document.querySelector('#app').innerHTML = `
  <header><a class="brand" href="/" aria-label="撅一下首页"><span class="brand-mark">撅</span> 撅一下<span class="brand-dot">®</span></a><span class="header-note">双人表情制造所 <span class="online-dot"></span></span></header>
  <main>
    <section class="editor" aria-labelledby="title">
      <div class="eyebrow">QQ MEME LAB <span>001 — 双人限定</span></div>
      <h1 id="title">好朋友，<br>就要<span class="accent">撅一下。</span></h1>
      <p class="intro">两个 QQ 号，一张快乐动图。</p>
      <form id="form" novalidate>
        <div class="people">
          <div class="person"><div class="person-heading"><span class="number">01</span><label for="qq1">谁来撅</label><span id="source1" class="source"></span></div><input id="qq1" name="qq1" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="输入第一个 QQ 号" aria-describedby="status"><label class="upload" for="file1">↗ 上传头像<input type="file" id="file1" accept="image/png,image/jpeg,image/webp,image/gif"></label></div>
          <button type="button" id="swap" class="swap" aria-label="交换双方" title="交换双方">⇄</button>
          <div class="person"><div class="person-heading"><span class="number">02</span><label for="qq2">撅谁呢</label><span id="source2" class="source"></span></div><input id="qq2" name="qq2" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="输入第二个 QQ 号" aria-describedby="status"><label class="upload" for="file2">↗ 上传头像<input type="file" id="file2" accept="image/png,image/jpeg,image/webp,image/gif"></label></div>
        </div>
        <button class="generate" id="generate" type="submit"><span>生成，撅一下</span><span aria-hidden="true">↗</span></button>
        <p id="status" class="status" role="status" aria-live="polite">填好双方 QQ 号，就可以开始了。</p>
      </form>
      <details><summary>头像读取与隐私说明</summary><p>QQ 头像经公共图片代理 wsrv.nl / images.weserv.nl 获取，对应 QQ 号会发送给代理与 QQ 头像服务。上传的头像仅在当前浏览器处理，不会上传。本站不存储号码或图片，不需要登录。头像无法读取时可改用上传。</p></details>
    </section>
    <section class="preview" aria-label="动图预览">
      <div class="preview-top"><span><span class="live-dot"></span> LIVE PREVIEW</span><span id="preview-tag">示例动图</span></div>
      <div class="stage"><span class="corner top-left"></span><span class="corner top-right"></span><div class="meme-paper"><img id="result" alt="由示例头像生成的撅动图" width="300" height="300"></div><span class="corner bottom-left"></span><span class="corner bottom-right"></span><span class="stage-caption">友情，就是这么简单。</span></div>
      <div class="preview-bottom"><div><strong id="result-title">快乐预览中</strong><span id="result-info">原版三帧 · 循环动图</span></div><a id="download" class="download disabled" aria-disabled="true">保存 GIF <span aria-hidden="true">↓</span></a></div>
      <p class="save-tip">手机可长按生成的动图保存；分享时请选择「原图」。</p>
    </section>
  </main>
  <footer><span>撅一下 / JUST FOR FUN</span><span>浏览器本地合成 <span class="footer-dot">·</span> <a href="https://github.com/MemeCrafters/meme-generator-contrib" target="_blank" rel="noreferrer">模板鸣谢 ↗</a></span></footer>`;

const $ = selector => document.querySelector(selector);
const inputs = [$('#qq1'), $('#qq2')];
let uploads = [null, null], busy = false, resultURL;
const status = (text, error = false) => { $('#status').textContent = text; $('#status').classList.toggle('error', error); };
function refreshSources() {
  uploads.forEach((value, i) => { $(`#source${i + 1}`).textContent = value ? '已选头像' : ''; inputs[i].placeholder = value ? '已使用上传头像（可不填）' : `输入第${i ? '二' : '一'}个 QQ 号`; });
}
function showResult(blob, example = false) {
  const nextURL = URL.createObjectURL(blob);
  const previous = resultURL; resultURL = nextURL;
  $('#result').src = nextURL;
  $('#result').alt = example ? '由示例头像生成的撅动图' : '双方头像生成的撅动图';
  if (previous) URL.revokeObjectURL(previous);
  if (!example) {
    $('#download').href = nextURL;
    $('#download').download = `jue-${inputs.map(input => input.value.trim() || 'avatar').join('-')}.gif`;
    $('#download').classList.remove('disabled'); $('#download').setAttribute('aria-disabled', 'false');
    $('#preview-tag').textContent = '生成成功'; $('#result-title').textContent = '你的快乐已就绪';
    $('#result-info').textContent = `300 × 300 · GIF · ${(blob.size / 1024).toFixed(0)} KB`;
    $('.meme-paper').animate([{ transform: 'rotate(-4deg) scale(.94)' }, { transform: 'rotate(-4deg) scale(1)' }], { duration: 300 });
  }
}
$('#download').addEventListener('click', event => { if ($('#download').getAttribute('aria-disabled') === 'true') event.preventDefault(); });
inputs.forEach((input, i) => input.addEventListener('input', () => { uploads[i] = null; $(`#file${i + 1}`).value = ''; refreshSources(); }));
for (let i = 0; i < 2; i++) {
  $(`#file${i + 1}`).addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) { status('请选择小于 8 MB 的头像图片。', true); event.target.value = ''; return; }
    try { uploads[i] = await decode(file); refreshSources(); status(`第${i ? '二' : '一'}个头像已选好，点击生成即可。`); }
    catch { status('无法读取这张图片，请换一张 PNG 或 JPG。', true); }
  });
}
$('#swap').addEventListener('click', () => {
  if (busy) return;
  [inputs[0].value, inputs[1].value] = [inputs[1].value, inputs[0].value];
  uploads.reverse(); refreshSources(); status('双方已交换，点击生成查看新动图。');
});
$('#form').addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return;
  const numbers = inputs.map(input => input.value.trim());
  for (let i = 0; i < 2; i++) {
    if (!uploads[i] && !/^[1-9]\d{4,11}$/.test(numbers[i])) { status(`请填写有效的第${i ? '二' : '一'}个 QQ 号（5–12 位数字），或上传头像。`, true); inputs[i].focus(); return; }
  }
  busy = true;
  const controls = [...document.querySelectorAll('input, button')]; controls.forEach(el => { el.disabled = true; });
  $('#generate span').textContent = '正在准备快乐…'; status('正在读取头像，请稍等…');
  try {
    const cache = new Map();
    const avatars = await Promise.all(numbers.map((qq, i) => {
      if (uploads[i]) return uploads[i];
      if (!cache.has(qq)) cache.set(qq, loadAvatar(qq));
      return cache.get(qq);
    }));
    status('头像已就位，正在合成 GIF…');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    showResult(await renderMeme(...avatars)); status('生成成功！点击「保存 GIF」，或长按动图保存。');
  } catch (error) { status(error.message || '生成失败，请稍后重试。', true); }
  finally { busy = false; controls.forEach(el => { el.disabled = false; }); $('#generate span').textContent = '生成，撅一下'; }
});
renderMeme(sampleAvatar('我', '#d5fa44', '#20231b'), sampleAvatar('你', '#e2deef', '#59516b'))
  .then(blob => { if (!resultURL) showResult(blob, true); }).catch(() => status('示例加载失败，请刷新重试。', true));
