import React from 'react';
import { ArenaFinalResults, ArenaFinalResultsProps } from './ArenaFinalResults';

export const ArenaResultsScreen: React.FC<ArenaFinalResultsProps> = (props) => {
  return <ArenaFinalResults {...props} />;
};

export default ArenaResultsScreen;
