import os
import cv2
import numpy as np
import itertools
from ultralytics import YOLO


class BladeAnalyzer:
    def __init__(self, weights_path: str = 'core/runs/obb/train-2/weights/best.pt', ang_tolerance: float = 0.5):
        self.weights_path = weights_path
        self.ang_tolerance = ang_tolerance
        self.model = None
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.weights_path):
            print(f"載入模型權重： {self.weights_path}")
            self.model = YOLO(self.weights_path)
        else:
            print(f"警告： 找不到模型權重檔案 {self.weights_path}")

    @staticmethod
    def get_mid_points(obb):
        pts = np.array(obb, dtype=np.float32)
        d01 = np.linalg.norm(pts[0] - pts[1])
        d12 = np.linalg.norm(pts[1] - pts[2])

        if d01 < d12:
            mid1 = (pts[0] + pts[1]) / 2
            mid2 = (pts[2] + pts[3]) / 2
        else:
            mid1 = (pts[0] + pts[3]) / 2
            mid2 = (pts[1] + pts[2]) / 2
        return mid1, mid2

    def check_straight(self, blades, obbs, stable_hub):
        v_j = np.array([0, -1], dtype=np.float32)

        for idx, (m1, m2) in enumerate(blades):
            dist1 = np.linalg.norm(m1 - stable_hub)
            dist2 = np.linalg.norm(m2 - stable_hub)

            if dist1 < dist2:
                root_pt, tip_pt = m1, m2
            else:
                root_pt, tip_pt = m2, m1

            v = tip_pt - root_pt
            norm = np.linalg.norm(v)
            if norm == 0:
                continue

            cos_theta = np.dot(v, v_j) / norm
            cos_theta = np.clip(cos_theta, -1.0, 1.0)
            ang_diff = np.degrees(np.arccos(cos_theta))

            if ang_diff <= self.ang_tolerance:
                vertical_blade_info = {
                    'tip': tip_pt,
                    'root': root_pt,
                    'ang_diff': ang_diff,
                    'obb': obbs[idx]
                }
                return vertical_blade_info, stable_hub
        return None

    def process_video_for_modeling(self, video_path: str, output_base_dir: str) -> int:
        if self.model is None:
            raise RuntimeError("YOLO 模型未成功載入，無法分析")

        cap = cv2.VideoCapture(video_path)

        output_dir = os.path.join(output_base_dir, 'clean')
        os.makedirs(output_dir, exist_ok=True)

        saved_count = 0
        hub_history = []

        print(f"正在處理影像： {video_path}")

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            results = self.model.predict(
                source=video_path,
                stream=True,
                imgsz=320,
                conf=0.25,
                device='cpu',
                verbose=True
            )

            for frame_idx, result in enumerate(results):
                frame = result.orig_img

                if result.obb is None:
                    continue

                obbs = results[0].obb.xyxyxyxy.cpu().numpy()

                if len(obbs) != 3:
                    continue

                blades = [self.get_mid_points(obb) for obb in obbs]

                min_perimeter = float('inf')
                inside_nodes = None
                for p0, p1, p2 in itertools.product(blades[0], blades[1], blades[2]):
                    perimeter = np.linalg.norm(p0 - p1) + np.linalg.norm(p0 - p2) + np.linalg.norm(p1 - p2)
                    if perimeter < min_perimeter:
                        min_perimeter = perimeter
                        inside_nodes = (p0, p1, p2)

                if inside_nodes is None:
                    frame_idx += 1
                    continue

                current_hub = np.mean(inside_nodes, axis=0)
                hub_history.append(current_hub)

                if len(hub_history) > 50:
                    hub_history = hub_history[-50:]

                stable_hub = np.median(hub_history, axis=0)

                res = self.check_straight(blades, obbs, stable_hub)

                if res is None:
                    continue

                saved_count += 1
                clean_path = os.path.join(output_dir, f"frame_{frame_idx:05d}.jpg")
                cv2.imwrite(clean_path, frame)

        cap.release()
        print(f"成功辨識出 {saved_count} 幀影像")
        return saved_count