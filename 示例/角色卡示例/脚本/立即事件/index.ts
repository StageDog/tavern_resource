$(async () => {
  injectPrompts([
    {
      id: '冲动啊，请平息吧',
      position: 'none',
      depth: 0,
      role: 'system',
      content: '【【冲动啊，请平息吧】】',
      filter: () => _.get(getAllVariables(), 'stat_data.白娅.依存度') === 0,
      should_scan: true,
    },
    {
      id: '理智啊，请不要冻结',
      position: 'none',
      depth: 0,
      role: 'system',
      content: '【【理智啊，请不要冻结】】',
      filter: () => _.get(getAllVariables(), 'stat_data.白娅.依存度') === 100,
      should_scan: true,
    },
  ]);
});
