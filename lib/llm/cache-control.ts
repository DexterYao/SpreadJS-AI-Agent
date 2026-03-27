import type { ModelMessage } from "ai";

const ANTHROPIC_CACHE_CONTROL = {
	anthropic: { cacheControl: { type: "ephemeral" as const } },
};

/**
 * Anthropic prompt caching 注入。
 *
 * 在倒数第二条消息上打 `cache_control: ephemeral` 断点，
 * 使 system + tools + 历史消息前缀走 cache read (0.1x input price)。
 *
 * 非 Anthropic provider 会忽略 `providerOptions.anthropic`，无副作用。
 * 消息不足 2 条时原样返回（无可缓存前缀）。
 */
export function injectCacheControl(
	messages: ModelMessage[],
	isAnthropic: boolean,
): ModelMessage[] {
	if (!isAnthropic || messages.length < 2) return messages;

	return messages.map((msg, i) => {
		if (i !== messages.length - 2) return msg;
		return {
			...msg,
			providerOptions: {
				...msg.providerOptions,
				...ANTHROPIC_CACHE_CONTROL,
			},
		};
	});
}
