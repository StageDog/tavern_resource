import { prettifyErrorWithInput } from '@/util/common';

export function registerMvuSchema(input: z.ZodObject | (() => z.ZodObject)) {
  if (typeof registerVariableSchema === 'function') {
    registerVariableSchema(z.object({ stat_data: typeof input === 'function' ? input() : input }), { type: 'message' });
  }

  const unwrapSchema = () => {
    if (typeof input === 'function') {
      const schema = input();
      if (typeof registerVariableSchema === 'function') {
        registerVariableSchema(z.object({ stat_data: schema }), { type: 'message' });
      }
      return schema;
    }
    return input;
  };

  eventOn('mag_variable_initialized', (variables, swipe_id) => {
    const schema = unwrapSchema();
    try {
      const result = schema.safeParse(_.get(variables, 'stat_data', {}));
      if (result.success) {
        variables.stat_data = result.data;
        return;
      }
      reportError('warn', z.prettifyError(result.error), `第 ${swipe_id + 1} 条开场白的变量初始化失败`);
    } catch (e) {
      const error = e as Error;
      reportError(
        'error',
        error.stack ? error.stack : error.name + ': ' + error.message,
        `第 ${swipe_id + 1} 条开场白的变量初始化失败`,
      );
    }
  });

  eventOn('mag_command_parsed', (variables, commands) => {
    const schema = unwrapSchema();
    const notification_enabled = Boolean($('#mvu_notification_error').prop('checked'));

    const check_and_apply = (data: any, command: Mvu.CommandInfo, should_toastr: boolean) => {
      try {
        const result = schema.safeParse(data, { reportInput: true });
        if (result.success) {
          variables.stat_data = result.data;
          return true;
        }
        if (notification_enabled && should_toastr) {
          reportError(
            'warn',
            prettifyErrorWithInput(result.error),
            `发生变量更新错误，可能需要重Roll: ${command.full_match}`,
          );
        }
      } catch (e) {
        const error = e as Error;
        reportError(
          'error',
          error.stack ? error.stack : error.name + ': ' + error.message,
          `发生变量更新错误，可能需要重Roll: ${command.full_match}`,
        );
      }
      return false;
    };

    const old_data = klona(variables.stat_data);

    for (const command of commands) {
      let data = klona(variables.stat_data);
      const path = trimQuotesAndBackslashes(command.args[0]);
      switch (command.type) {
        case 'set': {
          if (command.args.length === 3) {
            command.args.splice(1, 1);
          }
          if (path) {
            _.set(data, path, parseCommandValue(command.args[1]));
          } else {
            data = parseCommandValue(command.args[1]);
          }
          check_and_apply(data, command, true);
          break;
        }
        case 'insert': {
          const key_or_index = parseCommandValue(command.args[1]);
          const value = parseCommandValue(command.args.at(-1)!);

          const insert = (data: any, should_toastr: boolean) => {
            const collection = path === '' ? data : _.get(data, path);
            const is_array = _.isArray(collection);
            if (command.args.length === 2) {
              if (is_array) {
                collection.push(value);
              } else {
                _.assign(collection, value);
              }
            } else if (is_array) {
              collection.splice(key_or_index, 0, value);
            } else {
              collection[String(key_or_index)] = value;
            }
            return check_and_apply(data, command, should_toastr);
          };

          const collection = path === '' ? data : _.get(data, path);
          const is_nil = _.isNil(collection);
          if (!is_nil && !_.isArray(collection) && !_.isPlainObject(collection)) {
            continue;
          }
          if (!is_nil) {
            insert(data, true);
            continue;
          }
          const filled = _(klona(data));
          if (!insert(filled.set(path, {}).value(), false)) {
            insert(filled.set(path, []).value(), true);
          }
          break;
        }
        case 'delete': {
          const path = command.args.map(trimQuotesAndBackslashes).join('.');
          const path_array = _(path).toPath().value();
          const parent_path = _(path_array).dropRight().join('.');
          if (_.isArray(_.get(data, parent_path))) {
            _.pullAt(_.get(data, parent_path), Number(_(path_array).last()));
          } else {
            _.unset(data, path);
          }
          check_and_apply(data, command, true);
          break;
        }
      }
    }

    function keepReadonly(new_data: Record<string, any>, old_data: Record<string, any>): void {
      function traverse(obj: Record<string, any>, path: Array<string | number> = []) {
        if (!_.isObjectLike(obj)) {
          return;
        }
        _.forOwn(obj, (value, key) => {
          const current_path = [...path, key];
          if (key.startsWith('_')) {
            const rhs_value = _.get(old_data, current_path);
            if (rhs_value !== undefined) {
              _.set(new_data, current_path, rhs_value);
            }
          }
          if (_.isObjectLike(value)) {
            traverse(value, current_path);
          }
        });
      }
      traverse(new_data);
    }
    keepReadonly(variables.stat_data, old_data);

    _.unset(variables, 'schema');
    _.unset(variables, 'display_data');
    _.unset(variables, 'delta_data');
    commands.length = 0;
  });

  console.info('变量结构注册成功');
}

function reportError(level: 'error' | 'warn', content: string, title: string) {
  toastr[level === 'warn' ? 'warning' : 'error'](content.replaceAll('\n', '<br>'), `[MVU zod]` + title, {
    escapeHtml: false,
  });
  console[level](`${title} ${content}`);
}

function trimQuotesAndBackslashes(string: string): string {
  return string.replace(/^[\\"'` ]*(.*?)[\\"'` ]*$/, '$1');
}

function parseCommandValue(string: string): any {
  const value = parseCommandValueImpl(string);
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(item => (item instanceof Date ? item.toISOString() : item));
  }
  return value;
}

function parseCommandValueImpl(string: string): any {
  const trimmed = string.trim();

  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }
  if (trimmed === 'null') {
    return null;
  }
  if (trimmed === 'undefined') {
    return undefined;
  }

  try {
    return JSON.parse(trimmed);
  } catch (e) {
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const result = new Function(`return ${trimmed};`)();
        if (_.isObject(result) || Array.isArray(result)) {
          return result;
        }
      } catch (err) {
        // 如果解析失败，说明它可能是一个未加引号的字符串，继续往下走
      }
    }
  }

  try {
    return YAML.parse(trimmed);
  } catch (e) {
    /** empty */
  }

  return trimQuotesAndBackslashes(string);
}
