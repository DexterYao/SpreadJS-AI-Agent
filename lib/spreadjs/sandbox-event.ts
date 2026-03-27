export type SandboxPhase = "pre-executing" | "executing" | "done";

interface PhaseDetail {
	executionId: string;
	phase: SandboxPhase;
}

class SandboxEventBus {
	private target = new EventTarget();

	emitPhase(executionId: string, phase: SandboxPhase): void {
		this.target.dispatchEvent(
			new CustomEvent<PhaseDetail>("phase", {
				detail: { executionId, phase },
			}),
		);
	}

	onPhase(handler: (detail: PhaseDetail) => void): () => void {
		const listener = (e: Event) =>
			handler((e as CustomEvent<PhaseDetail>).detail);
		this.target.addEventListener("phase", listener);
		return () => this.target.removeEventListener("phase", listener);
	}
}

export const sandboxEvent = new SandboxEventBus();
