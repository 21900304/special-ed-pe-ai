const SQUAT_DOWN_THRESHOLD = 120; // Knee angle < 120° = SQUATTING
const SQUAT_UP_THRESHOLD = 160; // Knee angle > 160° = STANDING

type SquatState = 'STANDING' | 'SQUATTING';

export class SquatCounter {
  private count = 0;
  private state: SquatState = 'STANDING';

  update(kneeAngle: number): { count: number; state: SquatState } {
    if (this.state === 'STANDING' && kneeAngle < SQUAT_DOWN_THRESHOLD) {
      this.state = 'SQUATTING';
    } else if (this.state === 'SQUATTING' && kneeAngle > SQUAT_UP_THRESHOLD) {
      this.state = 'STANDING';
      this.count++;
    }

    return { count: this.count, state: this.state };
  }

  reset(): void {
    this.count = 0;
    this.state = 'STANDING';
  }

  getCount(): number {
    return this.count;
  }

  getState(): SquatState {
    return this.state;
  }
}
