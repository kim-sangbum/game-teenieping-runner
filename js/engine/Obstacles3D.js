/**
 * Obstacles3D.js
 * 3D 장애물 4종 모델 및 애니메이션
 * 1. 망치 (Swinging Hammer)
 * 2. 움직이는 톱니바퀴 (Rolling Saw Blade)
 * 3. 까시 (Spikes Trap)
 * 4. 싱크홀 (Sinkhole)
 */

export class Obstacles3D {
  /**
   * 1. 3D 스윙 망치 생성
   */
  static createHammer(THREE, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // 상단 지지대
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x444950, roughness: 0.5 });
    const pivotPoint = new THREE.Group();
    pivotPoint.position.set(0, 4.2, 0); // 회전 중심 높이

    // 망치 자루 (원통)
    const shaftGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
    shaftGeo.translate(0, -1.6, 0);
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.6 });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    pivotPoint.add(shaft);

    // 망치 헤드 (묵직한 쇠 블록)
    const headGeo = new THREE.BoxGeometry(1.6, 0.9, 0.9);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x8892b0,
      metalness: 0.8,
      roughness: 0.3
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, -3.2, 0);
    head.castShadow = true;
    pivotPoint.add(head);

    group.add(pivotPoint);

    group.userData = {
      type: 'hammer',
      pivotPoint,
      swingSpeed: 2.2 + Math.random() * 0.8,
      swingPhase: Math.random() * Math.PI,
      width: 1.6,
      depth: 1.0,
      hitCooldown: 0
    };

    return group;
  }

  /**
   * 2. 움직이는 3D 톱니바퀴 생성
   */
  static createSawBlade(THREE, x, z, trackWidth = 8) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const sawMat = new THREE.MeshStandardMaterial({
      color: 0xd90429,
      metalness: 0.85,
      roughness: 0.25
    });

    // 톱니 원판
    const discGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.12, 16);
    discGeo.rotateZ(Math.PI / 2);
    const disc = new THREE.Mesh(discGeo, sawMat);
    disc.position.y = 0.9;
    disc.castShadow = true;
    group.add(disc);

    // 톱니 이빨들
    const toothCount = 8;
    for (let i = 0; i < toothCount; i++) {
      const angle = (i / toothCount) * Math.PI * 2;
      const toothGeo = new THREE.ConeGeometry(0.18, 0.4, 4);
      toothGeo.rotateZ(-Math.PI / 2);
      const tooth = new THREE.Mesh(toothGeo, sawMat);
      tooth.position.set(
        0,
        0.9 + Math.sin(angle) * 0.9,
        Math.cos(angle) * 0.9
      );
      tooth.rotation.x = -angle;
      group.add(tooth);
    }

    group.userData = {
      type: 'saw',
      disc,
      moveSpeed: 3.0 + Math.random() * 1.5,
      dir: Math.random() < 0.5 ? 1 : -1,
      minX: -trackWidth / 2 + 1.2,
      maxX: trackWidth / 2 - 1.2,
      width: 1.8,
      depth: 1.8,
      hitCooldown: 0
    };

    return group;
  }

  /**
   * 3. 3D 가시 트랩 (Spikes) 생성
   */
  static createSpikes(THREE, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // 바닥 프레임
    const baseGeo = new THREE.BoxGeometry(2.4, 0.08, 1.8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x2b2d42 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.04;
    group.add(base);

    // 날카로운 원뿔 가시 그리드
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0xedf2f4,
      metalness: 0.9,
      roughness: 0.2
    });

    const rows = 3;
    const cols = 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const spikeGeo = new THREE.ConeGeometry(0.12, 0.55, 6);
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        spike.position.set(
          -0.9 + c * 0.6,
          0.28,
          -0.6 + r * 0.6
        );
        spike.castShadow = true;
        group.add(spike);
      }
    }

    group.userData = {
      type: 'spikes',
      width: 2.4,
      depth: 1.8,
      hitCooldown: 0
    };

    return group;
  }

  /**
   * 4. 3D 싱크홀 (Sinkhole) 생성
   */
  static createSinkhole(THREE, x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const holeRadius = 1.35;

    // 검은 구멍 바닥
    const holeGeo = new THREE.CircleGeometry(holeRadius, 24);
    const holeMat = new THREE.MeshBasicMaterial({
      color: 0x050508,
      depthWrite: false
    });
    const hole = new THREE.Mesh(holeGeo, holeMat);
    hole.rotation.x = -Math.PI / 2;
    hole.position.y = 0.03;
    group.add(hole);

    // 싱크홀 경고 네온 림(Rim)
    const rimGeo = new THREE.TorusGeometry(holeRadius, 0.08, 8, 24);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0xff0055,
      roughness: 0.2
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.04;
    group.add(rim);

    group.userData = {
      type: 'sinkhole',
      radius: holeRadius,
      width: holeRadius * 2,
      depth: holeRadius * 2,
      hitCooldown: 0
    };

    return group;
  }

  /**
   * 장애물 프레임 업데이트
   */
  static updateObstacle(obsGroup, dt, timer) {
    const d = obsGroup.userData;
    if (!d) return;

    if (d.hitCooldown > 0) {
      d.hitCooldown -= dt;
    }

    if (d.type === 'hammer') {
      // 망치 시계추 스윙 각도
      const angle = Math.sin(timer * d.swingSpeed + d.swingPhase) * (Math.PI * 0.38);
      d.pivotPoint.rotation.z = angle;
    } else if (d.type === 'saw') {
      // 톱니바퀴 좌우 이동
      obsGroup.position.x += d.dir * d.moveSpeed * dt;
      if (obsGroup.position.x > d.maxX) {
        obsGroup.position.x = d.maxX;
        d.dir = -1;
      } else if (obsGroup.position.x < d.minX) {
        obsGroup.position.x = d.minX;
        d.dir = 1;
      }
      // 톱니 자체 고속 회전
      obsGroup.rotation.x += dt * 15 * d.dir;
    } else if (d.type === 'sinkhole') {
      // 싱크홀 펄스 효과
      const scale = 1.0 + Math.sin(timer * 5) * 0.04;
      obsGroup.scale.set(scale, 1, scale);
    }
  }
}

