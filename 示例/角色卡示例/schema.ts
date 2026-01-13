export const Schema = z.object({
  世界: z.object({
    当前时间: z.string(),
    当前地点: z.string(),
    近期事务: z.record(z.string().describe('事务名'), z.string().describe('事务描述')),
  }),

  白娅: z
    .object({
      依存度: z.coerce.number().transform(v => _.clamp(v, 0, 100)),
      着装: z.record(z.enum(['上装', '下装', '内衣', '袜子', '鞋子', '饰品']), z.string().describe('服装描述')),
      称号: z.record(
        z.string().describe('称号名'),
        z.object({
          效果: z.string(),
          自我评价: z.string(),
        }),
      ),
    })
    .transform(data => {
      const $依存度阶段 =
        data.依存度 < 20
          ? '消极自毁'
          : data.依存度 < 40
            ? '渴求注视'
            : data.依存度 < 60
              ? '暗中靠近'
              : data.依存度 < 80
                ? '忐忑相依'
                : '柔软依存';
      data.称号 = _(data.称号)
        .entries()
        .takeRight(Math.ceil(data.依存度 / 10))
        .fromPairs()
        .value();
      return { ...data, $依存度阶段 };
    }),

  主角: z.object({
    物品栏: z
      .record(
        z.string().describe('物品名'),
        z.object({
          描述: z.string(),
          数量: z.coerce.number(),
        }),
      )
      .transform(data => _.pickBy(data, ({ 数量 }) => 数量 > 0)),
  }),
});
export type Schema = z.output<typeof Schema>;
