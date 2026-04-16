// Shim for @mediapipe/hands — only needed when using tfjs runtime.
// The actual library is not imported; this satisfies static import analysis.
export const Hands = undefined;
export const HAND_CONNECTIONS: number[][] = [
  [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],
  [13,17],[0,17],[17,18],[18,19],[19,20],
];
export const VERSION = '';
