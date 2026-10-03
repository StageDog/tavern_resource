const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');
const _ = require('lodash');
const { klona } = require('klona');
const z = require('zod');
const yaml = require('yaml');

// 在独立宿主中加载真实源码及错误格式化函数，不依赖远程构建产物或真实酒馆。
function create_host(schema, notification_enabled = true) {
  const listeners = new Map();
  const notifications = [];
  const context = vm.createContext({
    _,
    klona,
    z,
    YAML: yaml,
    $: () => ({ prop: () => notification_enabled }),
    eventOn: (name, listener) => listeners.set(name, listener),
    console: { info() {}, warn() {}, error() {} },
    toastr: {
      warning: (...args) => notifications.push(args),
      error: (...args) => notifications.push(args),
    },
  });
  const modules = new Map();
  function load_module(filename) {
    if (modules.has(filename)) return modules.get(filename);
    const source = fs.readFileSync(path.join(__dirname, '..', 'util', filename), 'utf8');
    const { outputText: output_text } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    });
    const module = { exports: {} };
    const local_require = name => (name === '@util/common' ? load_module('common.ts') : require(name));
    vm.runInContext(`(function(require, module, exports) { ${output_text}\n})`, context)(
      local_require,
      module,
      module.exports,
    );
    modules.set(filename, module.exports);
    return module.exports;
  }
  load_module('mvu_zod.ts').registerMvuSchema(schema);
  return {
    notifications,
    run(variables, commands, on_error) {
      listeners.get('mag_command_parsed_for_zod')(variables, commands, 'original message', on_error);
      listeners.get('mag_command_parsed_ended_for_zod')(variables, commands, 'original message');
    },
  };
}

function command(type, args) {
  return { type, args, full_match: `${type}(${args.join(',')})`, reason: '' };
}

for (const notification_enabled of [true, false]) {
  test(`callback collects every schema error without toastr (notifications ${notification_enabled})`, () => {
    const host = create_host(z.object({ hp: z.number(), name: z.string() }), notification_enabled);
    const variables = { stat_data: { hp: 72, name: 'Alice' } };
    const errors = ['earlier error'];
    const commands = [command('set', ['hp', '"invalid"']), command('set', ['name', '42'])];
    host.run(variables, commands, error => errors.push(error));
    assert.equal(errors.length, 3);
    assert.match(errors[1], /set\(hp/);
    assert.match(errors[2], /set\(name/);
    assert.match(errors[1], /路径: hp/);
    assert.deepEqual(variables.stat_data, { hp: 72, name: 'Alice' });
    assert.equal(commands.length, 0);
    assert.equal(host.notifications.length, 0);
  });

  test(`legacy callers preserve the notification setting (${notification_enabled})`, () => {
    const host = create_host(z.object({ hp: z.number() }), notification_enabled);
    host.run({ stat_data: { hp: 72 } }, [command('set', ['hp', '"invalid"'])]);
    assert.equal(host.notifications.length, notification_enabled ? 1 : 0);
  });
}

test('reports nonnumeric delta and missing move source through the callback', () => {
  const host = create_host(z.any(), false);
  const errors = [];
  host.run(
    { stat_data: { name: 'Alice' } },
    [command('add', ['name', '1']), command('move', ['missing', 'target'])],
    error => errors.push(error),
  );
  assert.equal(errors.length, 2);
  assert.match(errors[0], /不能对非数字类型/);
  assert.match(errors[1], /移动源路径不存在/);
  assert.equal(host.notifications.length, 0);
});

test('reports a throwing schema transform through the callback', () => {
  const host = create_host(
    z.object({
      hp: z.number().transform(() => {
        throw new Error('transform failed');
      }),
    }),
  );
  const errors = [];
  host.run({ stat_data: { hp: 72 } }, [command('set', ['hp', '73'])], error => errors.push(error));
  assert.equal(errors.length, 1);
  assert.match(errors[0], /transform failed/);
  assert.equal(host.notifications.length, 0);
});

test('successful array fallback does not report the failed object probe', () => {
  const host = create_host(z.object({ items: z.array(z.string()) }));
  const variables = { stat_data: {} };
  const errors = [];
  host.run(variables, [command('insert', ['items', '0', '"key"'])], error => errors.push(error));
  assert.equal(JSON.stringify(variables.stat_data), '{"items":["key"]}');
  assert.deepEqual(errors, []);
  assert.equal(host.notifications.length, 0);
});

test('successful commands still apply alongside failures', () => {
  const host = create_host(z.object({ hp: z.number() }));
  const variables = { stat_data: { hp: 72 } };
  const errors = [];
  host.run(variables, [command('set', ['hp', '"invalid"']), command('set', ['hp', '80'])], error => errors.push(error));
  assert.equal(variables.stat_data.hp, 80);
  assert.equal(errors.length, 1);
  assert.equal(host.notifications.length, 0);
});
