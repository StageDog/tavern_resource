export function defineMvuDataStore(schema: z.ZodObject, variable_option: VariableOption) {
  if (
    variable_option.type === 'message' &&
    (variable_option.message_id === undefined || variable_option.message_id === 'latest')
  ) {
    variable_option.message_id = -1;
  }

  return defineStore(
    `mvu_data.${_(variable_option)
      .entries()
      .sortBy(entry => entry[0])
      .map(entry => entry[1])
      .join('.')}`,
    errorCatched(() => {
      const data = ref(schema.parse(_.get(getVariables(variable_option), 'stat_data', {})));

      useIntervalFn(() => {
        const result = schema.safeParse(_.get(getVariables(variable_option), 'stat_data', {}));
        if (result.error || _.isEqual(result.data, data.value)) {
          return;
        }
        ignoreUpdates(() => {
          data.value = result.data;
        });
      }, 2000);

      const { ignoreUpdates } = watchIgnorable(
        data,
        new_data => {
          const result = schema.safeParse(new_data);
          if (result.error) {
            return;
          }
          if (!_.isEqual(result, new_data)) {
            ignoreUpdates(() => {
              data.value = result.data;
            });
          }
          updateVariablesWith(variables => _.set(variables, 'stat_data', result.data), variable_option);
        },
        { deep: true },
      );

      return { data };
    }),
  );
}
