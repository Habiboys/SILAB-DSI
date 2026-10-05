import unittest

import numpy as np

from recognition import FaceEngine


class _FakeEmbedder:
    def __init__(self, vector_fn):
        self._vector_fn = vector_fn
        self.calls = 0

    def embeddings(self, crops):
        self.calls += 1
        return np.array([self._vector_fn() for _ in crops], dtype=np.float32)


class RecognitionFlowTest(unittest.TestCase):
    def engine(self, face_map, vector_fn):
        """face_map: list truthy/None sesuai urutan frame (truthy = ada wajah)."""
        engine = FaceEngine.__new__(FaceEngine)
        faces = iter(face_map)
        engine.decode = lambda _: object()
        engine.detect_face = lambda _: next(faces)
        engine.embedder = _FakeEmbedder(vector_fn)
        return engine

    def frames(self):
        return ["frame"] * 12

    def test_enroll_collects_and_skips_blank_frames(self):
        engine = self.engine([True] * 6 + [None] * 6, lambda: np.ones(512, dtype=np.float32))
        result = engine.analyze(self.frames(), enroll=True)
        self.assertTrue(result["success"])
        self.assertEqual(len(result["embeddings"]), 6)

    def test_no_face_fails_as_embedding(self):
        engine = self.engine([None] * 12, lambda: np.ones(512, dtype=np.float32))
        result = engine.analyze(self.frames(), enroll=True)
        self.assertFalse(result["success"])
        self.assertEqual("embedding_failed", result["reason"])

    def test_enroll_needs_minimum_samples(self):
        engine = self.engine([True] * 3 + [None] * 9, lambda: np.ones(512, dtype=np.float32))
        result = engine.analyze(self.frames(), enroll=True)
        self.assertFalse(result["success"])
        self.assertEqual("insufficient_samples", result["reason"])

    def test_embedding_runs_in_single_batch(self):
        engine = self.engine([True] * 12, lambda: np.ones(512, dtype=np.float32))
        engine.analyze(self.frames(), references=[np.ones(512).tolist()])
        self.assertEqual(engine.embedder.calls, 1)

    def test_verify_match(self):
        engine = self.engine([True] * 12, lambda: np.ones(512, dtype=np.float32))
        result = engine.analyze(self.frames(), references=[np.ones(512).tolist()])
        self.assertTrue(result["success"])
        self.assertGreaterEqual(result["similarity"], 0.7)

    def test_verify_mismatch(self):
        engine = self.engine([True] * 12, lambda: np.zeros(512, dtype=np.float32))
        result = engine.analyze(self.frames(), references=[np.ones(512).tolist()])
        self.assertFalse(result["success"])
        self.assertEqual("face_mismatch", result["reason"])

    def test_verify_without_enrollment_fails(self):
        engine = self.engine([True] * 12, lambda: np.ones(512, dtype=np.float32))
        result = engine.analyze(self.frames(), references=[])
        self.assertFalse(result["success"])
        self.assertEqual("not_enrolled", result["reason"])


if __name__ == "__main__":
    unittest.main()
