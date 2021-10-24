import {
  ReactiveController,
  ReactiveControllerHost,
} from '@lit/reactive-element';
import {Spring, SpringConfig as WobbleSpringConfig} from 'wobble';

/**
 * A reactive controller that implements a 1D spring physics simulation based
 * on the equations behind damped harmonic oscillators
 * (https://en.wikipedia.org/wiki/Harmonic_oscillator#Damped_harmonic_oscillator).
 */
export class SpringController implements ReactiveController {
  private _host: ReactiveControllerHost & HTMLElement;

  protected _spring: Spring;
  private _toValue: number;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options?: Partial<WobbleSpringConfig>
  ) {
    this._host = host;
    host.addController(this);
    this._toValue = options?.toValue ?? 0;
    this._spring = new Spring(options);
    this._spring.onUpdate(() => this._host.requestUpdate());
  }

  get currentValue() {
    return this._spring.currentValue;
  }

  /**
   * The spring's current velocity in units / ms.
   */
  get currentVelocity(): number {
    return this._spring.currentVelocity;
  }

  /**
   * If the spring has reached its `toValue`, or if its velocity is below the
   * `restVelocityThreshold`, it is considered at rest. If `stop()` is called
   * during a simulation, both `isAnimating` and `isAtRest` will be false.
   */
  get isAtRest(): boolean {
    return this._spring.isAtRest;
  }

  /**
   * Whether or not the spring is currently emitting values.
   *
   * Note: this is distinct from whether or not it is at rest.
   * See also `isAtRest`.
   */
  get isAnimating(): boolean {
    return this._spring.isAnimating;
  }

  get toValue() {
    return this._toValue;
  }

  set toValue(toValue: number) {
    this._toValue = toValue;
    this._spring.updateConfig({toValue});
    if ((this._host as HTMLElement).isConnected) {
      this._spring.start();
    }
  }

  hostConnected() {
    this._spring.start();
  }

  hostDisconnected() {
    this._spring.stop();
  }
}

export interface Position2D {
  x: number;
  y: number;
}

// TODO: omit fromValue and toValue
export interface Spring2DConfig extends Partial<WobbleSpringConfig> {
  toPosition?: Position2D;
  fromPosition?: Position2D;
}

/**
 * A reactive controller that implements a 2D spring physics simulation by
 * combining two 1D spring controllers.
 */
export class SpringController2D implements ReactiveController {
  private _xSpring: SpringController;
  private _ySpring: SpringController;

  _toPosition: Position2D;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options?: Spring2DConfig
  ) {
    this._toPosition = options?.toPosition ?? {x: 0, y: 0};
    this._xSpring = new SpringController(host, {
      ...options,
      toValue: this._toPosition.x,
    });
    this._ySpring = new SpringController(host, {
      ...options,
      toValue: this._toPosition.y,
    });
  }

  get currentPosition() {
    return {x: this._xSpring.currentValue, y: this._ySpring.currentValue};
  }

  /**
   * The spring's current velocity in units / ms.
   */
  get currentVelocity(): number {
    const dx = this._xSpring.currentVelocity;
    const dy = this._ySpring.currentVelocity;
    return Math.sqrt(dx ** 2 + dy ** 2);
  }

  /**
   * If the spring has reached its `toValue`, or if its velocity is below the
   * `restVelocityThreshold`, it is considered at rest. If `stop()` is called
   * during a simulation, both `isAnimating` and `isAtRest` will be false.
   */
  get isAtRest(): boolean {
    return this._xSpring.isAtRest && this._ySpring.isAtRest;
  }

  /**
   * Whether or not the spring is currently emitting values.
   *
   * Note: this is distinct from whether or not it is at rest.
   * See also `isAtRest`.
   */
  get isAnimating(): boolean {
    return this._xSpring.isAnimating || this._ySpring.isAnimating;
  }

  get toPosition() {
    return this._toPosition;
  }

  set toPosition(v: Position2D) {
    this._toPosition = v;
    this._xSpring.toValue = v.x;
    this._ySpring.toValue = v.y;
  }

  hostConnected() {
    this._xSpring.hostConnected();
    this._ySpring.hostConnected();
  }

  hostDisconnected() {
    this._xSpring.hostDisconnected();
    this._ySpring.hostDisconnected();
  }
}
