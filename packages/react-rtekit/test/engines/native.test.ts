import { nativeEngine } from '../../src/engines/native/engine.js';
import { describeEngineConformance } from './conformance.js';

/**
 * The in-house engine against the same contract the Lexical adapter passes.
 *
 * This file is the point of ADR-006: when it is green, "finished" is a fact rather than
 * an opinion, and the Lexical adapter can go.
 */
describeEngineConformance({ id: 'native', engine: nativeEngine });
