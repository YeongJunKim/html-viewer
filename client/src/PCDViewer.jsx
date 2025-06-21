import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const PCDViewer = ({ blob }) => {
    const mountRef = useRef();
    const [blobUrl, setBlobUrl] = useState(null);
    const controlsRef = useRef();
    const cameraRef = useRef();
    const pointsRef = useRef();
    const initialCameraState = useRef({ position: new THREE.Vector3(), target: new THREE.Vector3() });
    const [pointSize, setPointSize] = useState(1);

    useEffect(() => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        setBlobUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [blob]);

    useEffect(() => {
        if (!blobUrl) return;

        const scene = new THREE.Scene();
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        const mount = mountRef.current;
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        mount.appendChild(renderer.domElement);

        const camera = new THREE.PerspectiveCamera(70, mount.clientWidth / mount.clientHeight, 0.01, 10000);
        cameraRef.current = camera;

        const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = false;
controls.dampingFactor = 0.05;
controls.minPolarAngle =0
controls.maxPolarAngle = Math.PI;
controls.minAzimuthAngle = -Infinity;
controls.maxAzimuthAngle = Infinity;
controls.enableZoom = true;
controls.enablePan = true;
controlsRef.current = controls;

        scene.background = new THREE.Color(0x000000);

        const loader = new PCDLoader();
        loader.load(blobUrl, (points) => {
            const pos = points.geometry.attributes.position.array;

            for (let i = 0; i < pos.length; i++) {
                if (isNaN(pos[i])) pos[i] = 0;
            }

            points.geometry.computeBoundingBox();
            const boundingBox = points.geometry.boundingBox;
            const center = new THREE.Vector3();
            boundingBox.getCenter(center);

            const size = new THREE.Vector3();
            boundingBox.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);

            // 포인트 크기 설정
            points.material.sizeAttenuation = true;
            points.material.size = maxDim * 0.01 * pointSize;

            scene.add(points);
            pointsRef.current = points;

            // 카메라 위치 조정
            const offset = maxDim * 1;
            camera.position.copy(center.clone().add(new THREE.Vector3(0, 0, offset)));
            camera.lookAt(center);
            controls.target.copy(center);
            controls.update();

            initialCameraState.current.position.copy(camera.position);
            initialCameraState.current.target.copy(controls.target);
        });

        const animate = () => {
            requestAnimationFrame(animate);
            
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            controls.update();

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            renderer.dispose();
            if (renderer.domElement && mount.contains(renderer.domElement)) {
                mount.removeChild(renderer.domElement);
            }
        };
    }, [blobUrl]);

    // 슬라이더 핸들러
    const handlePointSizeChange = (e) => {
        const sizeValue = parseFloat(e.target.value);
        setPointSize(sizeValue);
        if (pointsRef.current) {
            const size = pointsRef.current.geometry.boundingBox.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            pointsRef.current.material.size = maxDim * 0.01 * sizeValue;
        }
    };

    const handleResetView = () => {
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!camera || !controls) return;

        camera.position.copy(initialCameraState.current.position);
        controls.target.copy(initialCameraState.current.target);
        controls.update();
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* 렌더링 화면 */}
            <div style={{ width: '100%', height: '100%' }} ref={mountRef}></div>

            {/* 왼쪽 위 UI 컨트롤 */}
            <div style={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: '10px',
                borderRadius: '8px',
                zIndex: 1
            }}>
                <div>
                    <label>Point Size: {pointSize}</label>
                    <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={pointSize}
                        onChange={handlePointSizeChange}
                        style={{ width: '100px', marginLeft: '10px' }}
                    />
                </div>
                <button onClick={handleResetView}>🔄 Reset View</button>
            </div>
        </div>
    );
};

export default PCDViewer;
