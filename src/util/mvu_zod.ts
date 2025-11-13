export function registerMvuSchema(schema: z.ZodType<any>) {
  eventOn('mag_command_parsed', (variables, commands) => {
    const check_and_apply = (data: any) => {
      const result = schema.safeParse(data);
      if (result.success) {
        variables.stat_data = result.data;
        return true;
      }
      return false;
    };

    for (const command of commands) {
      const data = klona(variables.stat_data);
      const path = trimQuotesAndBackslashes(command.args[0]);
      switch (command.type) {
        case 'set': {
          if (command.args.length === 3) {
            command.args.splice(1, 1);
          }
          _.set(data, path, parseCommandValue(command.args[1]));
          check_and_apply(data);
          break;
        }
        case 'insert': {
          const key_or_index = parseCommandValue(command.args[1]);
          const value = parseCommandValue(command.args.at(-1)!);

          const insert = (data: any) => {
            const collection = _.get(data, path);
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
            return check_and_apply(data);
          };

          const collection = _.get(data, path);
          const is_nil = _.isNil(collection);
          if (!is_nil && !_.isArray(collection) && !_.isPlainObject(collection)) {
            continue;
          }
          if (!is_nil) {
            insert(data);
            continue;
          }
          const filled = _(klona(data));
          if (!insert(filled.set(path, {}).value())) {
            insert(filled.set(path, []).value());
          }
          break;
        }
        case 'delete': {
          _.unset(data, command.args.map(trimQuotesAndBackslashes));
          check_and_apply(data);
          break;
        }
      }
    }
    commands.length = 0;
  });
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
