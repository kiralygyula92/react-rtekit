import { nativeEngine } from '../../src/engines/native/engine.js';
import { describeEngineConformance } from './conformance.js';

/**
 * The in-house engine against the contract.
 *
 * The suite was written against the engine this one replaced, and passed by it first, so "finished" is a fact rather than an opinion. It
 * went green, and the old adapter went.
 */
describeEngineConformance({ id: 'native', engine: nativeEngine });
