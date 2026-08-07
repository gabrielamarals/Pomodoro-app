import os
from pathlib import Path
import tempfile
import unittest
from uuid import uuid4


_temp_directory = tempfile.TemporaryDirectory()
os.environ["DATABASE_URL"] = f"sqlite:///{(Path(_temp_directory.name) / 'test.db').as_posix()}"
os.environ["COOKIE_SECURE"] = "false"

from fastapi.testclient import TestClient

from app.api import app
from app.db import engine


def tearDownModule():
    engine.dispose()
    _temp_directory.cleanup()


class ApiFlowTests(unittest.TestCase):
    def setUp(self):
        self.client_a = TestClient(app)
        self.client_b = TestClient(app)
        self.client_a.__enter__()
        self.client_b.__enter__()

    def tearDown(self):
        self.client_b.__exit__(None, None, None)
        self.client_a.__exit__(None, None, None)

    def _create_and_login(self, client: TestClient, email: str):
        self.assertEqual(client.post("/auth/register", json={"email": email, "password": "safe-password"}).status_code, 201)
        self.assertEqual(client.post("/auth/login", json={"email": email, "password": "safe-password"}).status_code, 200)

    def test_health_and_unauthenticated_access(self):
        self.assertEqual(self.client_a.get("/health").json(), {"status": "ok", "database": "connected"})
        self.assertEqual(self.client_a.get("/sessions/recent").status_code, 401)

    def test_users_cannot_read_each_others_data(self):
        self._create_and_login(self.client_a, "a@example.com")
        self._create_and_login(self.client_b, "b@example.com")

        category_a = self.client_a.post("/categories", json={"name": "Python"}).json()
        category_b = self.client_b.post("/categories", json={"name": "Python"}).json()
        self.assertNotEqual(category_a["id"], category_b["id"])

        created = self.client_a.post("/sessions", json={
            "work_time": 25,
            "rest_time": 5,
            "session_date": "2026-08-07",
            "goal": "SQLAlchemy",
            "category_id": category_a["id"],
            "client_session_id": str(uuid4()),
        })
        self.assertEqual(created.status_code, 201)

        self.assertEqual(len(self.client_a.get("/sessions/recent").json()), 1)
        self.assertEqual(self.client_b.get("/sessions/recent").json(), [])
        self.assertEqual(self.client_b.get(f"/categories/{category_a['id']}/sessions").json(), [])
        self.assertEqual(self.client_b.post("/sessions", json={
            "work_time": 25,
            "rest_time": 5,
            "session_date": "2026-08-07",
            "category_id": category_a["id"],
            "client_session_id": str(uuid4()),
        }).status_code, 422)

    def test_session_retry_is_idempotent(self):
        self._create_and_login(self.client_a, "retry@example.com")
        self._create_and_login(self.client_b, "retry-b@example.com")
        client_session_id = str(uuid4())
        payload = {
            "work_time": 25,
            "rest_time": 5,
            "session_date": "2026-08-07",
            "goal": "Reliable save",
            "category_id": None,
            "client_session_id": client_session_id,
        }

        first = self.client_a.post("/sessions", json=payload)
        retry = self.client_a.post("/sessions", json=payload)

        self.assertEqual(first.status_code, 201)
        self.assertEqual(retry.status_code, 201)
        self.assertEqual(first.json()["id"], retry.json()["id"])
        self.assertEqual(len(self.client_a.get("/sessions/recent").json()), 1)
        confirmed = self.client_a.get(
            f"/sessions/by-client-id/{client_session_id}"
        )
        self.assertEqual(confirmed.status_code, 200)
        self.assertEqual(confirmed.json()["id"], first.json()["id"])
        self.assertEqual(
            self.client_b.get(
                f"/sessions/by-client-id/{client_session_id}"
            ).status_code,
            404,
        )

    def test_onboarding_and_preferences_persist(self):
        self._create_and_login(self.client_a, "profile@example.com")
        response = self.client_a.post("/me/onboarding/complete", json={
            "display_name": "Ana",
            "primary_goal": "school",
            "main_difficulty": "phone",
            "focus_range": "25_45",
            "days_per_week": 5,
            "focus_minutes": 30,
            "rest_minutes": 7,
        })
        self.assertEqual(response.status_code, 200)
        account = self.client_a.get("/me").json()
        self.assertTrue(account["profile"]["onboarding_completed"])
        self.assertEqual(account["profile"]["display_name"], "Ana")
        self.assertEqual(account["preferences"]["focus_minutes"], 30)

        self.client_a.patch("/me/preferences", json={"theme": "ember", "locale": "en"})
        preferences = self.client_a.get("/me/preferences").json()
        self.assertEqual((preferences["theme"], preferences["locale"]), ("ember", "en"))


if __name__ == "__main__":
    unittest.main()
