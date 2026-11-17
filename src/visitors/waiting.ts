// Coloured-in fish waiting for the operator to let them in, since anything can be coloured inside an outline.
import type { VisitorFish } from './visitorFish';

export class WaitingFish {
  private waiting: { id: number; fish: VisitorFish }[] = [];
  private nextId = 0;

  /** At most `limit` wait at once; beyond it the oldest is turned away, so a flood of fish cannot fill memory. */
  constructor(private limit = 50) {}

  add(fish: VisitorFish): number {
    const id = this.nextId++;
    this.waiting.push({ id, fish });
    if (this.waiting.length > this.limit) this.waiting.shift();
    return id;
  }

  list(): readonly { id: number; fish: VisitorFish }[] {
    return this.waiting;
  }

  /** Takes a fish out of the queue to go into the tank. */
  letIn(id: number): VisitorFish | undefined {
    const index = this.waiting.findIndex((w) => w.id === id);
    if (index < 0) return undefined;
    return this.waiting.splice(index, 1)[0]!.fish;
  }

  turnAway(id: number): void {
    this.waiting = this.waiting.filter((w) => w.id !== id);
  }
}
