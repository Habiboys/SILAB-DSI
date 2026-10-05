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

    def test_static_face_fails_as_blink(self):
        static = self.engine_with_readings([(0.1, 0)] * 12)
        self.assertEqual("blink_failed", static.analyze(self.frames(), ["blink", "left"])["reason"])

    def test_blink_without_turn_fails_as_turn(self):
        no_turn = self.engine_with_readings([(0.1, 0)] * 6 + [(0.9, 0)] * 2 + [(0.1, 0)] * 4)
        self.assertEqual("turn_failed", no_turn.analyze(self.frames(), ["blink", "left"])["reason"])

    def test_turn_in_wrong_direction_fails(self):
        wrong = self.engine_with_readings([(0.9, 0)] * 2 + [(0.1, 20)] * 4 + [(0.1, 0)] * 6)
        self.assertEqual("turn_failed", wrong.analyze(self.frames(), ["blink", "left"])["reason"])

    def test_turn_tolerates_timeline_order(self):
        # Putaran muncul sebelum kedip: tetap lolos karena deteksi berbasis sinyal, bukan urutan kaku.
        blink_after_turn = self.engine_with_readings([(0.1, -20)] * 3 + [(0.9, 0)] * 2 + [(0.1, 0)] * 7)
        result = blink_after_turn.analyze(self.frames(), ["blink", "left"], references=[np.ones(512).tolist()])
        self.assertTrue(result["success"])

    def test_multiple_faces_fail_before_embedding(self):
        engine = self.engine_with_readings([None] * 12)
        self.assertEqual("face_count", engine.analyze(self.frames(), ["blink", "right"])["reason"])


if __name__ == "__main__":
    unittest.main()
