import { Recipe } from '../../types';
import { buildBowlSteps, columnSteps } from '../../utils/bowlSteps';

export interface UniversityGroup {
    title: string;
    steps: ReturnType<typeof columnSteps>;
    stepsBowl: ReturnType<typeof columnSteps>;
    zig: number;
    scale: number;
}
