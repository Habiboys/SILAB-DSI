import unittest

import numpy as np

from recognition import FaceEngine


class RecognitionFlowTest(unittest.TestCase):
    def engine_with_readings(self, readings):
        engine = FaceEngine.__new__(FaceEngine)
        samples = iter(readings)
        engine.decode = lambda _: object()
        engine.signals = lambda _: next(samples)
        engine.face_embedding = lambda _: np.ones(512, dtype=np.float32)
        return engine

    def frames(self):
        return ["frame"] * 12

    def test_blink_then_requested_turn_can_match(self):
        readings = [(0.1, 0)] * 2 + [(0.8, 0)] * 2 + [(0.1, 0)] + [(0.1, -20)] * 2 + [(0.1, 0)] * 5
        engine = self.engine_with_readings(readings)
        result = engine.analyze(self.frames(), ["blink", "left"], references=[np.ones(512).tolist()])
        self.assertTrue(result["success"])
        self.assertGreaterEqual(result["similarity"], 0.7)

    def test_static_face_and_wrong_turn_order_fail(self):
        static = self.engine_with_readings([(0.1, 0)] * 12)
        self.assertEqual("liveness_failed", static.analyze(self.frames(), ["blink", "left"])["reason"])
        wrong_order = self.engine_with_readings([(0.1, -20)] * 3 + [(0.8, 0)] * 2 + [(0.1, 0)] * 7)
        self.assertEqual("liveness_failed", wrong_order.analyze(self.frames(), ["blink", "left"])["reason"])

    def test_multiple_faces_fail_before_embedding(self):
        engine = self.engine_with_readings([None] * 12)
        self.assertEqual("face_count", engine.analyze(self.frames(), ["blink", "right"])["reason"])


if __name__ == "__main__":
    unittest.main()
