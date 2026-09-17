import { lexicalEngine } from '../../src/engines/lexical/index.js';
import { describeEngineConformance } from './conformance.js';

/**
 * The Lexical adapter against the `EngineHandle` contract.
 *
 * This is what makes `conformance.ts` a specification rather than a wish list: the suite
 * describes behaviour that one adapter demonstrably has, so a second one has a fixed
 * target instead of "whatever Lexical happens to do".
 */
describeEngineConformance({ id: 'lexical', engine: lexicalEngine });
