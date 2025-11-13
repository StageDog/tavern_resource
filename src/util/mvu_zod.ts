export function registerMvuSchema(schema: z.ZodType<any>) {
  eventOn('mag_command_parsed', (variables, commands) => {
    for (const command of commands) {
      const new_data = klona(variables.stat_data);
      const path = trimQuotesAndBackslashes(command.args[0]);
      switch (command.type) {
        case 'set': {
          if (command.args.length === 3) {
            command.args.splice(1, 1);
          }
          _.set(new_data, path, parseCommandValue(command.args[1]));
          break;
        }
        case 'insert': {
          const collection = _.get(new_data, path);
          const is_array = _.isArray(collection);
          const is_object = _.isPlainObject(collection);
          if (!is_array && !is_object) {
            continue;
          }
          const value = parseCommandValue(command.args.at(-1)!);
          if (command.args.length === 2) {
            if (is_array) {
              collection.push(value);
            } else {
              _.assign(collection, value);
            }
          } else {
            const key_or_index = parseCommandValue(command.args[1]);
            if (is_array) {
              collection.splice(key_or_index, 0, value);
            } else {
              collection[String(key_or_index)] = value;
            }
          }
          break;
        }
        case 'delete': {
          _.unset(new_data, command.args);
          break;
        }
      }
      const result = schema.safeParse(new_data);
      if (result.success) {
        variables.stat_data = result.data;
      }
    }
    commands.length = 0;
  });
}

function trimQuotesAndBackslashes(string: string): string {
  return string.replace(/^[\\"'` ]*(.*?)[\\"'` ]*$/, '$1');
}

function parseCommandValue(string: string): any {
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
        // 如果解析失败，说明它可能是一个未加引号的字符串或数学表达式，继续往下走
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
