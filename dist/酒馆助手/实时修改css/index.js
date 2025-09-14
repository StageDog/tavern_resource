
const css_url = '填入你的css链接';
const delay = 1000;
let css;
async function refresh_css() {
    const response = await fetch(css_url);
    if (!response.ok) {
        toastr.error(`未能从 '${css_url}' 获取 css 文件, 请确认链接是否有效`, '实时修改css');
        return;
    }
    const new_css = await response.text();
    if (css != new_css) {
        css = new_css;
        $('#customCSS').val(css)[0].dispatchEvent(new Event('input'));
    }
}
let id;
$(() => {
    id = setInterval(refresh_css, delay);
});
$(window).on('pagehide', () => {
    clearInterval(id);
});

