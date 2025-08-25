async function initialize_based_on_user_role(): Promise<void> {
  const lorebook = getCharLorebooks().primary;
  if (!lorebook) {
    toastr.error('请导入本角色卡的世界书!');
    return;
  }

  const default_variables: Record<string, Record<string, number>> = {
    元首派医生: {
      '变量.艾莉卡.好感度': _.random(20, 50),
      '变量.艾琳.好感度': _.random(30, 70),
      '变量.安娜斯塔西娅.好感度': 0,
      '变量.海尔嘉.好感度': _.random(10, 60),
      '变量.莫妮卡.好感度': _.random(20, 30),
      '变量.维多利亚.好感度': _.random(0, 40),
      '变量.伊丽莎白.好感度': 0,
      '变量.伊琳娜.好感度': _.random(10, 30),
      '变量.伊薇特.好感度': _.random(0, 20),
    },
    蛇之眼高层: {
      '变量.艾莉卡.好感度': _.random(0, 50),
      '变量.艾琳.好感度': _.random(10, 40),
      '变量.安娜斯塔西娅.好感度': _.random(0, 20),
      '变量.海尔嘉.好感度': _.random(20, 50),
      '变量.莫妮卡.好感度': _.random(40, 60),
      '变量.维多利亚.好感度': _.random(0, 100),
      '变量.伊丽莎白.好感度': _.random(0, 50),
      '变量.伊琳娜.好感度': 0,
      '变量.伊薇特.好感度': _.random(40, 80),
    },
  };

  const roles = await getLorebookEntries(lorebook).then(entries =>
    entries
      .filter(entry => entry.comment.includes('user身份是') && entry.enabled)
      .map(entry => entry.comment.replace('user身份是', '')),
  );
  const initialization: Record<string, number> = _.mergeWith(
    {},
    ...roles.map(entry => _.defaultTo(default_variables[entry], {})),
    (object_value: number, source_value: number) => {
      return _.sample([object_value, source_value]);
    },
  );

  let message = getChatMessages(0)[0].message;
  message = message.replace(
    /(?<=\|初始化变量\|)(\s*)(?=<UpdateVariable>)/,
    Object.entries(initialization)
      .map(([key, value]) => `\n@${key}=${value}@`)
      .join('') + '\n',
  );
  await setChatMessages([{ message_id: 0, message }], { refresh: 'affected' });
}

$(async () => {
  eventOn(tavern_events.MESSAGE_SENT, async message_id => {
    if (message_id === 1) {
      initialize_based_on_user_role();
    }
  });
});
