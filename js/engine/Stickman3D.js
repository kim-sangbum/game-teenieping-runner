/**
 * Stickman3D.js -> Teenieping3D
 * Three.js 기반 캐치! 티니핑(Teenieping) 스타일 귀여운 3D 요정 캐릭터 및 군단 시뮬레이션
 * 
 * [티니핑 캐릭터 비주얼 사양]
 * 1. 둥글둥글 귀여운 치비 머리(대두 비율) & 화사한 파스텔 핑크/스킨톤
 * 2. 반짝반짝 큰 보석 눈망울, 발그레한 볼터치, 깜찍한 미소 입 페이스 텍스처
 * 3. 양옆 귀여운 요정 귀/트윈 번 & 이마의 반짝이는 3D 하트 마법 보석
 * 4. 앙증맞은 요정 드레스 망토 & 가슴 리본 장식
 * 5. 등 뒤에서 파닥파닥 퍼덕이는 반짝이는 투명 요정 날개 (Wing Flap 애니메이션)
 * 6. 깜찍한 아장아장 달리기 모션 & 승리 시 양손 번쩍 환호 점프
 * 7. 황금 보물상자 보상용 예쁜 로열 크라운(Royal Crown) 장착 지원
 */

export class Stickman3D {
  static _faceTexture = null;

  /**
   * 반짝이는 티니핑 얼굴 텍스처 (자체 2D Canvas 생성)
   */
  static getFaceTexture(THREE) {
    if (this._faceTexture) return this._faceTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 256);

    // 1. 큰 눈망울 (좌우)
    const drawEye = (cx, cy) => {
      ctx.save();
      ctx.translate(cx, cy);

      // 눈 외곽
      ctx.fillStyle = '#240046';
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 46, 0, 0, Math.PI * 2);
      ctx.fill();

      // 보석 그라데이션 홍채
      const grad = ctx.createLinearGradient(0, -42, 0, 42);
      grad.addColorStop(0, '#5a189a');
      grad.addColorStop(0.5, '#c77dff');
      grad.addColorStop(1, '#ff70a6');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 4, 28, 40, 0, 0, Math.PI * 2);
      ctx.fill();

      // 동공
      ctx.fillStyle = '#10002b';
      ctx.beginPath();
      ctx.ellipse(0, -2, 14, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // 메인 하이라이트 (빛방울)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-7, -14, 9, 13, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // 보조 하이라이트 (작은 별빛)
      ctx.beginPath();
      ctx.arc(8, 12, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // 속눈썹 라인
      ctx.strokeStyle = '#240046';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, -40, 32, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      ctx.restore();
    };

    drawEye(78, 116);
    drawEye(178, 116);

    // 2. 발그레한 핑크 볼터치
    const drawBlush = (bx, by) => {
      const bGrad = ctx.createRadialGradient(bx, by, 0, bx, by, 22);
      bGrad.addColorStop(0, 'rgba(255, 75, 139, 0.75)');
      bGrad.addColorStop(1, 'rgba(255, 75, 139, 0)');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(bx, by, 22, 0, Math.PI * 2);
      ctx.fill();
    };

    drawBlush(50, 156);
    drawBlush(206, 156);

    // 3. 앙증맞은 :3 미소 입
    ctx.strokeStyle = '#4a0e4e';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(120, 162, 7.5, 0, Math.PI * 0.95);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(136, 162, 7.5, 0.05, Math.PI);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    this._faceTexture = texture;
    return texture;
  }

  /**
   * 황금 로열 크라운(왕관) 3D 메시 생성
   */
  static createRoyalCrown(THREE) {
    const crownGroup = new THREE.Group();

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xffaa00,
      emissiveIntensity: 0.25
    });

    // 1. 왕관 테두리 링
    const bandGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.08, 18);
    const band = new THREE.Mesh(bandGeo, goldMat);
    crownGroup.add(band);

    // 2. 5개의 뾰족한 봉우리 & 보석 구체
    const peakGeo = new THREE.ConeGeometry(0.065, 0.22, 6);
    const jewelColors = [0xff0055, 0x00d2ff, 0x00ff88, 0x9b51e0, 0xff7700];

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const x = Math.cos(angle) * 0.24;
      const z = Math.sin(angle) * 0.24;

      const peak = new THREE.Mesh(peakGeo, goldMat);
      peak.position.set(x, 0.12, z);
      peak.rotation.y = -angle;
      crownGroup.add(peak);

      const jewelGeo = new THREE.SphereGeometry(0.035, 8, 8);
      const jewelMat = new THREE.MeshStandardMaterial({
        color: jewelColors[i],
        emissive: jewelColors[i],
        emissiveIntensity: 0.7,
        roughness: 0.1
      });
      const jewel = new THREE.Mesh(jewelGeo, jewelMat);
      jewel.position.set(x, 0.24, z);
      crownGroup.add(jewel);
    }

    // 3. 앞면 중앙의 빛나는 하트 보석
    const centerJewelGeo = new THREE.OctahedronGeometry(0.07);
    const centerJewelMat = new THREE.MeshStandardMaterial({
      color: 0xff007f,
      emissive: 0xff007f,
      emissiveIntensity: 0.85,
      roughness: 0.1
    });
    const centerJewel = new THREE.Mesh(centerJewelGeo, centerJewelMat);
    centerJewel.position.set(0, 0.15, 0.26);
    crownGroup.add(centerJewel);

    return crownGroup;
  }

  /**
   * 단일 3D 티니핑(Teenieping) 캐릭터 메시 그룹 생성
   */
  static createStickmanMesh(THREE, colorHex = '#ff9ebb') {
    const group = new THREE.Group();

    // 기본 티니핑 핑크/파스텔 바디 재질
    const bodyColor = new THREE.Color(colorHex);
    const mat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.35,
      metalness: 0.1,
      emissive: bodyColor.clone().multiplyScalar(0.12)
    });

    // 1. 머리 피벗 (헤드 틸트 애니메이션용)
    const headPivot = new THREE.Group();
    headPivot.position.y = 0.92;
    group.add(headPivot);

    // 둥근 대두 머리 (구체)
    const headGeo = new THREE.SphereGeometry(0.38, 20, 16);
    const head = new THREE.Mesh(headGeo, mat);
    head.castShadow = true;
    headPivot.add(head);

    // 반짝이는 얼굴 (스프라이트/메시)
    const faceTex = this.getFaceTexture(THREE);
    const faceMat = new THREE.MeshBasicMaterial({
      map: faceTex,
      transparent: true,
      depthWrite: false
    });
    const facePlaneGeo = new THREE.PlaneGeometry(0.66, 0.66);
    const faceMesh = new THREE.Mesh(facePlaneGeo, faceMat);
    faceMesh.position.set(0, 0.02, 0.382);
    headPivot.add(faceMesh);

    // 이마의 3D 마법 하트 보석 (티니핑 시그니처)
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xff1493,
      emissive: 0xff4081,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const heartGroup = new THREE.Group();
    heartGroup.position.set(0, 0.36, 0.22);

    const heartSphereGeo = new THREE.SphereGeometry(0.065, 10, 8);
    const hLeft = new THREE.Mesh(heartSphereGeo, heartMat);
    hLeft.position.set(-0.045, 0.04, 0);
    heartGroup.add(hLeft);

    const hRight = new THREE.Mesh(heartSphereGeo, heartMat);
    hRight.position.set(0.045, 0.04, 0);
    heartGroup.add(hRight);

    const hConeGeo = new THREE.ConeGeometry(0.09, 0.11, 8);
    hConeGeo.rotateX(Math.PI);
    const hCone = new THREE.Mesh(hConeGeo, heartMat);
    hCone.position.set(0, -0.025, 0);
    heartGroup.add(hCone);
    headPivot.add(heartGroup);

    // 양옆 귀여운 요정 귀 / 번
    const earGeo = new THREE.SphereGeometry(0.13, 12, 10);
    earGeo.scale(1.0, 1.4, 0.7);

    const earLeft = new THREE.Mesh(earGeo, mat);
    earLeft.position.set(-0.36, 0.12, -0.05);
    earLeft.rotation.z = 0.35;
    headPivot.add(earLeft);

    const earRight = new THREE.Mesh(earGeo, mat);
    earRight.position.set(0.36, 0.12, -0.05);
    earRight.rotation.z = -0.35;
    headPivot.add(earRight);

    // 왕관 피벗 (보물상자 개봉 시 머리에 씌워짐)
    const crownPivot = new THREE.Group();
    crownPivot.position.set(0, 0.36, 0);
    const crownMesh = this.createRoyalCrown(THREE);
    crownMesh.visible = false; // 기본은 미착용 상태
    crownPivot.add(crownMesh);
    headPivot.add(crownPivot);

    // 2. 몸통 (깜찍한 벨 모양 요정 원피스 드레스)
    const dressMat = new THREE.MeshStandardMaterial({
      color: bodyColor.clone().offsetHSL(0, 0.1, 0.05),
      roughness: 0.4,
      emissive: bodyColor.clone().multiplyScalar(0.08)
    });
    const dressGeo = new THREE.CylinderGeometry(0.12, 0.28, 0.42, 16);
    const body = new THREE.Mesh(dressGeo, dressMat);
    body.position.y = 0.46;
    body.castShadow = true;
    group.add(body);

    // 가슴 리본 장식
    const bowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const bowGeo = new THREE.BoxGeometry(0.16, 0.06, 0.06);
    const bow = new THREE.Mesh(bowGeo, bowMat);
    bow.position.set(0, 0.62, 0.18);
    group.add(bow);

    // 3. 등 뒤의 파닥파닥 투명 요정 날개
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      emissive: 0xffe6ff,
      emissiveIntensity: 0.4,
      roughness: 0.1
    });

    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.quadraticCurveTo(0.2, 0.25, 0.32, 0.28);
    wingShape.quadraticCurveTo(0.38, 0.15, 0.25, 0.0);
    wingShape.quadraticCurveTo(0.15, -0.15, 0, 0);
    const wingGeo = new THREE.ShapeGeometry(wingShape);

    const leftWingPivot = new THREE.Group();
    leftWingPivot.position.set(-0.08, 0.52, -0.15);
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.scale.set(0.8, 0.8, 0.8);
    leftWingPivot.add(leftWing);
    group.add(leftWingPivot);

    const rightWingPivot = new THREE.Group();
    rightWingPivot.position.set(0.08, 0.52, -0.15);
    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.scale.set(-0.8, 0.8, 0.8); // 좌우 대칭
    rightWingPivot.add(rightWing);
    group.add(rightWingPivot);

    // 4. 귀여운 작은 팔들
    const limbMat = mat;
    const armGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.26, 8);
    armGeo.translate(0, -0.13, 0);

    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.18, 0.60, 0);
    const leftArm = new THREE.Mesh(armGeo, limbMat);
    leftArmPivot.add(leftArm);
    group.add(leftArmPivot);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.18, 0.60, 0);
    const rightArm = new THREE.Mesh(armGeo, limbMat);
    rightArmPivot.add(rightArm);
    group.add(rightArmPivot);

    // 5. 귀여운 짧은 다리들
    const legGeo = new THREE.CylinderGeometry(0.05, 0.055, 0.26, 8);
    legGeo.translate(0, -0.13, 0);

    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.11, 0.26, 0);
    const leftLeg = new THREE.Mesh(legGeo, limbMat);
    leftLeg.castShadow = true;
    leftLegPivot.add(leftLeg);
    group.add(leftLegPivot);

    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.11, 0.26, 0);
    const rightLeg = new THREE.Mesh(legGeo, limbMat);
    rightLeg.castShadow = true;
    rightLegPivot.add(rightLeg);
    group.add(rightLegPivot);

    // 바닥 그림자
    const shadowGeo = new THREE.CircleGeometry(0.32, 12);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.32
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    group.add(shadow);

    group.userData = {
      headPivot,
      head,
      body,
      crownPivot,
      crownMesh,
      leftWingPivot,
      rightWingPivot,
      leftArmPivot,
      rightArmPivot,
      leftLegPivot,
      rightLegPivot,
      mat,
      runPhase: Math.random() * Math.PI * 2
    };

    return group;
  }

  /**
   * 단일 티니핑 3D 애니메이션 갱신 (달리기, 환호, 날갯짓)
   */
  static updateStickmanAnimation(meshGroup, runTimer, state = 'running') {
    const d = meshGroup.userData;
    if (!d || !d.leftLegPivot) return;

    // 패배 시 쓰러짐
    if (state === 'fallen') {
      meshGroup.rotation.x = Math.PI / 2;
      meshGroup.position.y = 0.15;
      return;
    }

    // 승리 시 만세 점프 & 환호
    if (state === 'cheering') {
      const jump = Math.abs(Math.sin(runTimer * 8)) * 0.48;
      meshGroup.position.y = jump;

      // 만세 V자 손
      d.leftArmPivot.rotation.z = Math.PI * 0.75;
      d.rightArmPivot.rotation.z = -Math.PI * 0.75;
      d.leftArmPivot.rotation.x = 0;
      d.rightArmPivot.rotation.x = 0;

      // 신나게 파닥거리는 날개
      const wingFlutter = Math.sin(runTimer * 28) * 0.65;
      d.leftWingPivot.rotation.y = wingFlutter;
      d.rightWingPivot.rotation.y = -wingFlutter;

      // 깜찍한 머리 흔들기
      d.headPivot.rotation.z = Math.sin(runTimer * 6) * 0.12;

      d.leftLegPivot.rotation.x = 0;
      d.rightLegPivot.rotation.x = 0;
      return;
    }

    // 기본 달리기 모션 (아장아장 달리는 귀여운 발걸음 + 퍼덕이는 날개)
    const cycle = runTimer * 14 + d.runPhase;
    const legAngle = Math.sin(cycle) * 0.75;
    const armAngle = Math.cos(cycle) * 0.65;
    const bobbing = Math.abs(Math.sin(cycle * 2)) * 0.08;

    meshGroup.position.y = bobbing;
    meshGroup.rotation.x = 0.08; // 앞으로 살짝 기우는 달리기 자세

    // 다리와 팔 스윙
    d.leftLegPivot.rotation.x = legAngle;
    d.rightLegPivot.rotation.x = -legAngle;

    d.leftArmPivot.rotation.x = -armAngle;
    d.rightArmPivot.rotation.x = armAngle;
    d.leftArmPivot.rotation.z = 0.18;
    d.rightArmPivot.rotation.z = -0.18;

    // 요정 날개 파닥거림 (고속 펄럭임)
    const wingFlap = Math.sin(runTimer * 20 + d.runPhase) * 0.42;
    d.leftWingPivot.rotation.y = wingFlap;
    d.rightWingPivot.rotation.y = -wingFlap;

    // 아장아장 머리 까딱임
    d.headPivot.rotation.z = Math.sin(cycle) * 0.06;
  }
}

/**
 * 3D 군단(Crowd) 매니저
 */
export class CrowdManager3D {
  constructor(THREE, scene, stickmanColor = '#ff9ebb') {
    this.THREE = THREE;
    this.scene = scene;
    this.stickmanColor = stickmanColor;
    this.crowdGroup = new THREE.Group();
    this.scene.add(this.crowdGroup);

    this.pool = [];
    this.activeCount = 0;
    this.displayMax = 80;
  }

  setColor(colorHex) {
    this.stickmanColor = colorHex;
    for (const stickman of this.pool) {
      if (stickman.userData.mat) {
        stickman.userData.mat.color.set(colorHex);
        stickman.userData.mat.emissive.set(new this.THREE.Color(colorHex).multiplyScalar(0.12));
      }
    }
  }

  /**
   * 군단 인원수 및 피보나치 나선 배치 갱신
   */
  updateCrowd(targetCount, centerX, centerZ, runTimer, state = 'running') {
    this.crowdGroup.position.set(centerX, 0, centerZ);

    const visualCount = Math.max(1, Math.min(targetCount, this.displayMax));

    while (this.pool.length < visualCount) {
      const stickman = Stickman3D.createStickmanMesh(this.THREE, this.stickmanColor);
      this.pool.push(stickman);
      this.crowdGroup.add(stickman);
    }

    const goldenAngle = 2.39996;
    const spacing = 0.52; // 티니핑 볼륨감에 맞춘 간격

    for (let i = 0; i < this.pool.length; i++) {
      const stickman = this.pool[i];

      if (i < visualCount) {
        stickman.visible = true;

        if (visualCount === 1) {
          stickman.position.set(0, 0, 0);
        } else {
          const r = Math.sqrt(i) * spacing;
          const theta = i * goldenAngle;
          const offsetX = Math.cos(theta) * r;
          const offsetZ = Math.sin(theta) * (r * 0.85);
          stickman.position.set(offsetX, 0, offsetZ);
        }

        Stickman3D.updateStickmanAnimation(stickman, runTimer, state);
      } else {
        stickman.visible = false;
      }
    }
  }

  getCrowdRadius(count) {
    const visualCount = Math.min(count, this.displayMax);
    if (visualCount <= 1) return 0.45;
    return Math.sqrt(visualCount) * 0.52 * 0.85;
  }

  reset() {
    for (const stickman of this.pool) {
      stickman.visible = false;
    }
  }
}
