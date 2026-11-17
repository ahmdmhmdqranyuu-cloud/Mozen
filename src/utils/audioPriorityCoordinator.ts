/**
 * Audio Priority Coordinator & Non-Overlapping Deferral Queue
 *
 * Enforces strict hierarchy across all automated reminders & user media:
 *   Priority 5 (Highest): prayer_azan (Azan)
 *   Priority 4: iqama
 *   Priority 3: pre_prayer / duha / qiyam
 *   Priority 2: morningAzkar (sabah) / eveningAzkar (massa) / musaharati / iftar_cannon / dua_after
 *   Priority 1: salawat (Lowest scheduled reminder)
 *   Priority 0: recitation / disk_player / general preview
 *
 * Rules:
 * - An active Azan NEVER gets interrupted by another notification or overlapping Azan.
 * - Azkar preempts active Salawat or background recitation.
 * - If Azkar arrives while Azan is playing, it is queued and executes right after Azan ends.
 * - If Salawat arrives while Azan or Azkar is active, it yields/defers until higher-priority finishes.
 */

export type AudioChannelCategory =
  | 'azan'
  | 'iqama'
  | 'pre_prayer'
  | 'duha'
  | 'qiyam'
  | 'sabah'
  | 'massa'
  | 'musaharati'
  | 'cannon'
  | 'dua_after'
  | 'salawat'
  | 'ruqyah'
  | 'nasheed'
  | 'recitation'
  | 'disk'
  | 'general';

export interface ActivePlaybackDescriptor {
  id: string;
  category: AudioChannelCategory;
  priority: number;
  source: 'soundService' | 'disk' | 'recitation';
  startedAt: number;
}

export interface QueuedPlaybackRequest {
  id: string;
  category: AudioChannelCategory;
  priority: number;
  execute: () => void;
}

export function getCategoryPriority(category: string): number {
  switch (category) {
    case 'azan':
    case 'prayer_azan':
      return 5;
    case 'iqama':
      return 4;
    case 'pre_prayer':
    case 'prePrayerAlert':
    case 'duha':
    case 'qiyam':
    case 'qiyamFirstThird':
    case 'qiyamLastThird':
      return 3;
    case 'sabah':
    case 'morningAzkar':
    case 'massa':
    case 'eveningAzkar':
    case 'musaharati':
    case 'cannon':
    case 'iftarCannon':
    case 'dua_after':
      return 2;
    case 'salawat':
      return 1;
    case 'ruqyah':
    case 'nasheed':
    case 'recitation':
    case 'disk':
    default:
      return 0;
  }
}

export type RequestOutcome = 'started' | 'queued' | 'blocked_same_or_higher';

class AudioPriorityCoordinator {
  private active: ActivePlaybackDescriptor | null = null;
  private deferredQueue: QueuedPlaybackRequest[] = [];
  private stopCallbacks: Set<(incomingPriority: number, incomingSource: string) => void> = new Set();

  public onPreempt(cb: (incomingPriority: number, incomingSource: string) => void): () => void {
    this.stopCallbacks.add(cb);
    return () => this.stopCallbacks.delete(cb);
  }

  public getActive(): ActivePlaybackDescriptor | null {
    return this.active ? { ...this.active } : null;
  }

  public getQueueLength(): number {
    return this.deferredQueue.length;
  }

  /**
   * Evaluates whether a playback request should start immediately (preempting lower priority),
   * be queued for automatic playback after the active higher-priority item completes,
   * or be ignored because equal/higher priority is already active.
   */
  public requestStart(
    id: string,
    category: AudioChannelCategory,
    source: 'soundService' | 'disk' | 'recitation',
    options?: {
      deferIfBlocked?: boolean;
      onExecuteDeferred?: () => void;
      forceUserAction?: boolean;
    }
  ): RequestOutcome {
    const incomingPriority = getCategoryPriority(category);
    const current = this.active;

    if (current) {
      // Never allow Azan (or equal scheduled priority) to restart or cut off currently active Azan
      if (current.priority >= 5 && incomingPriority >= 5) {
        return 'blocked_same_or_higher';
      }

      // User manual clicks on recitation/disk only play if Azan isn't playing (or stop non-Azan items)
      const isUserManualOverride = Boolean(options?.forceUserAction) && current.priority < 5;

      if (!isUserManualOverride && current.priority >= incomingPriority) {
        // Queue Azkar or Salawat to play automatically right after the active Azan/higher item finishes
        if (options?.deferIfBlocked && options?.onExecuteDeferred && incomingPriority >= 1) {
          this.enqueueDeferred({
            id,
            category,
            priority: incomingPriority,
            execute: options.onExecuteDeferred,
          });
          return 'queued';
        }
        return 'blocked_same_or_higher';
      }

      // Higher priority preempts currently playing lower-priority audio cleanly
      this.stopCallbacks.forEach((cb) => {
        try {
          cb(incomingPriority, source);
        } catch {
          // ignore listener errors
        }
      });
    }

    this.active = {
      id,
      category,
      priority: incomingPriority,
      source,
      startedAt: Date.now(),
    };
    return 'started';
  }

  private enqueueDeferred(req: QueuedPlaybackRequest) {
    // Keep only one queued item per category (most recent replaces older duplicate)
    this.deferredQueue = this.deferredQueue.filter((q) => q.category !== req.category);
    this.deferredQueue.push(req);
    // Highest priority deferred runs first (e.g., Morning Azkar before Salawat)
    this.deferredQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Marks the active playback complete and immediately pops + runs the highest-priority deferred item.
   */
  public notifyFinished(id?: string): void {
    if (!this.active) return;
    if (id && this.active.id !== id) return;

    this.active = null;
    this.flushNextDeferred();
  }

  public clearActive(force: boolean = false): void {
    if (force) {
      this.deferredQueue = [];
    }
    this.active = null;
  }

  public resetAll(): void {
    this.active = null;
    this.deferredQueue = [];
  }

  private flushNextDeferred(): void {
    if (this.active || this.deferredQueue.length === 0) return;
    const next = this.deferredQueue.shift();
    if (next) {
      try {
        next.execute();
      } catch {
        this.flushNextDeferred();
      }
    }
  }
}

export const audioPriorityCoordinator = new AudioPriorityCoordinator();
