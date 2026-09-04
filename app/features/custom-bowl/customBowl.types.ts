import { PaPersona, BilingualMessage } from '../../types';

export interface CustomBowlState {
    customPhase: number;
    paPersona: PaPersona;
    currentSelections: string[];
    allSelections: Record<string, string | string[]>;
    resultMessage: BilingualMessage;
}
