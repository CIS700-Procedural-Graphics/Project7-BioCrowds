const THREE = require('three');

export function getConfig(num, gridSize) {
  let startPositions = [];
  let endPositions = [];
  switch(Number(num)) {
    case 1:
    {
      const NUM_AGENTS = 30;
      for (let i = 0; i < NUM_AGENTS; i++) {
        let x0 = (i / NUM_AGENTS) * (gridSize - 4) + 2;
        let z0 = 0;
        let x1 = x0;
        let z1 = gridSize;
        startPositions.push(new THREE.Vector3(x0, 0, z0));
        endPositions.push(new THREE.Vector3(x1, 0, z1));
      }
      for (let i = 0; i < NUM_AGENTS; i++) {
        let x1 = (i / NUM_AGENTS) * (gridSize - 4) + 2;
        let z1 = 0;
        let x0 = x1;
        let z0 = gridSize;
        startPositions.push(new THREE.Vector3(x0, 0.5, z0));
        endPositions.push(new THREE.Vector3(x1, 0.5, z1));
      }
      break;
    }
    case 2:
    {
      const NUM_AGENTS = 10;
      for (let i = 1; i < NUM_AGENTS; i++) {
        let x0 = (i / NUM_AGENTS) * (gridSize / 2) + gridSize / 4;
        let z0 = gridSize / 4;
        let x1 = (i / NUM_AGENTS) * gridSize;
        let z1 = gridSize - 2;
        startPositions.push(new THREE.Vector3(x0, 0, z0));
        endPositions.push(new THREE.Vector3(x1, 0, z1));
      }
      for (let i = 1; i < NUM_AGENTS; i++) {
        let z0 = (i / NUM_AGENTS) * (gridSize / 2) + gridSize / 4;
        let x0 = gridSize / 4;
        let z1 = (i / NUM_AGENTS) * gridSize;
        let x1 = gridSize - 2;
        startPositions.push(new THREE.Vector3(x0, 0.5, z0));
        endPositions.push(new THREE.Vector3(x1, 0.5, z1));
      }
      for (let i = 1; i < NUM_AGENTS; i++) {
        let x0 = (i / NUM_AGENTS) * (gridSize / 2) + gridSize / 4;
        let z0 = 3 * gridSize / 4;
        let x1 = (i / NUM_AGENTS) * gridSize;
        let z1 = 2;
        startPositions.push(new THREE.Vector3(x0, 0.5, z0));
        endPositions.push(new THREE.Vector3(x1, 0.5, z1));
      }
      for (let i = 1; i < NUM_AGENTS; i++) {
        let z0 = (i / NUM_AGENTS) * (gridSize / 2) + gridSize / 4;
        let x0 = 3 * gridSize / 4;
        let z1 = (i / NUM_AGENTS) * gridSize;
        let x1 = 2;
        startPositions.push(new THREE.Vector3(x0, 0.5, z0));
        endPositions.push(new THREE.Vector3(x1, 0.5, z1));
      }
      // outer -> inner
      for (let i = 1; i < NUM_AGENTS; i++) {
        let x0 = (i / NUM_AGENTS) * (gridSize / 2) + gridSize / 4;
        let z0 = gridSize / 4;
        let x1 = (i / NUM_AGENTS) * gridSize;
        let z1 = gridSize - 2;
        endPositions.push(new THREE.Vector3(x0, 0, z0));
        startPositions.push(new THREE.Vector3(x1, 0, z1));
      }
      for (let i = 1; i < NUM_AGENTS; i++) {
        let z0 = (i / NUM_AGENTS) * (gridSize / 2) + gridSize / 4;
        let x0 = gridSize / 4;
        let z1 = (i / NUM_AGENTS) * gridSize;
        let x1 = gridSize - 2;
        endPositions.push(new THREE.Vector3(x0, 0.5, z0));
        startPositions.push(new THREE.Vector3(x1, 0.5, z1));
      }
      for (let i = 1; i < NUM_AGENTS; i++) {
        let x0 = (i / NUM_AGENTS) * (gridSize / 2) + gridSize / 4;
        let z0 = 3 * gridSize / 4;
        let x1 = (i / NUM_AGENTS) * gridSize;
        let z1 = 2;
        endPositions.push(new THREE.Vector3(x0, 0.5, z0));
        startPositions.push(new THREE.Vector3(x1, 0.5, z1));
      }
      for (let i = 1; i < NUM_AGENTS; i++) {
        let z0 = (i / NUM_AGENTS) * (gridSize / 2) + gridSize / 4;
        let x0 = 3 * gridSize / 4;
        let z1 = (i / NUM_AGENTS) * gridSize;
        let x1 = 2;
        endPositions.push(new THREE.Vector3(x0, 0.5, z0));
        startPositions.push(new THREE.Vector3(x1, 0.5, z1));
      }
      break;
    }
    default:
    {
    }
  }

  return { startPositions: startPositions, endPositions: endPositions};
}
