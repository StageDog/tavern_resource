import { check_and_install_extensions } from './check_and_install_extensions';

const Settings = z.object({
  自动安装插件: z.record(z.string(), z.string()).default({}),
});

$(() => {
  const settings = Settings.parse(getVariables({ type: 'script', script_id: getScriptId() }));
  insertVariables(settings, { type: 'script', script_id: getScriptId() });

  setTimeout(
    () => check_and_install_extensions(Object.entries(settings.自动安装插件).map(([name, url]) => ({ name, url }))),
    10000,
  );
});
