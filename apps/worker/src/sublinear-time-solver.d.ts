declare module 'sublinear-time-solver' {
  export class EmergenceSystem {
    processWithEmergence(
      input: unknown,
      history: unknown[],
    ): Promise<Record<string, unknown>>;
  }
}

declare module 'sublinear-time-solver/tools' {
  export type DenseAdjacency = {
    rows: number;
    cols: number;
    data: number[][];
    format: 'dense';
  };

  export type PageRankResult = {
    pageRankVector: number[];
    topNodes: Array<{ node: number; score: number }>;
    statistics: {
      mean: number;
      standardDeviation: number;
      maxScore: number;
      minScore: number;
      entropy: number;
      totalScore: number;
    };
  };

  export class DynamicPsychoSymbolicTools {
    handleToolCall(
      tool: string,
      payload: Record<string, unknown>,
    ): Promise<Record<string, unknown>>;
  }

  export class GraphTools {
    static pageRank(options: {
      adjacency: DenseAdjacency;
      damping: number;
      epsilon: number;
      maxIterations: number;
    }): Promise<PageRankResult>;
  }
}
