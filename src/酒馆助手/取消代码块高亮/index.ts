import { loadReadme } from '@util/script';

const hljs = window.parent.hljs;

const original_highlightElement = hljs.highlightElement;

$(() => {
  loadReadme('https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/src/酒馆助手/取消代码块高亮/README.md');

  hljs.highlightElement = () => {};
  $('pre code')
    .removeAttr('data-highlighted')
    .text(function () {
      return $(this).text();
    });
});

$(window).on('pagehide', () => {
  hljs.highlightElement = original_highlightElement;
  $('pre code').each((_index, element) => {
    hljs.highlightElement(element);
  });
});
